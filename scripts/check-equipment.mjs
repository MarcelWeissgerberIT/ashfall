// Run with: node /Users/marcelweissgerber/Documents/Playground/check-ashfall-equipment-staging.mjs
// All mutations are confined to in-memory Game instances; no project files are written.
import assert from 'node:assert/strict';
import { Game, CAPACITY } from '../app/game/engine.mjs';
import { tutorialTarget } from '../app/game/tutorial.mjs';

let passed = 0;
const failures = [];
function check(name, fn) {
  try { fn(); passed++; console.log(`PASS ${name}`); }
  catch (error) { failures.push(name); console.error(`FAIL ${name}\n${error.stack}`); }
}
function playing() { const game = new Game(); game.start(false); game.companion=null; return game; } // Isolate Mara's weapon/armor; companion combat is tested separately.
function add(game, ...ids) {
  for (const id of ids) assert.equal(game.addItem(id), true, `Fixture item ${id} must fit`);
}
function near(actual, expected, label) {
  assert.ok(Math.abs(actual - expected) < 1e-8, `${label}: expected ${expected}, got ${actual}`);
}
function advance(game, seconds) {
  for (let remaining = seconds; remaining > 1e-9;) {
    const dt = Math.min(1 / 120, remaining);
    game.tick(dt); remaining -= dt;
  }
}
function until(game, condition, label, maximumTicks = 7200) {
  for (let i = 0; i < maximumTicks && !condition(); i++) game.tick(1 / 60);
  assert.ok(condition(), `${label}; mode=${game.mode}, step=${game.tutorial.index}, path=${game.path.length}`);
}
function adjacentEnemy(game, canAttack = false) {
  const enemy = {
    ...game.zombies[0], id: 'test-adjacent', x: game.player.x, y: game.player.y + .95,
    hp: 1000, maxHp: 1000, attack: canAttack ? 0 : Infinity, repath: Infinity,
    path: [], alert: true, home: { x: game.player.x, y: game.player.y + .95 },
  };
  game.zombies = [enemy];
  return enemy;
}

for (const [held, damage, cooldown] of [
  ['crowbar', 38, .7], ['axe', 54, 1], [null, 19, .7], ['bottle', 19, .7],
]) check(`actual melee damage and cadence: ${held ?? 'fists'}`, () => {
  const game = playing(); add(game, 'axe');
  if (held === null) game.unequip('hand');
  else if (held !== 'crowbar') game.equip(held);
  assert.equal(game.has('crowbar'), true, 'Unheld crowbar stays in inventory');
  const enemy = adjacentEnemy(game);
  game.tick(.001);
  assert.equal(enemy.hp, 1000 - damage);
  near(game.player.attack, cooldown, 'Cooldown after the first hit');
  advance(game, cooldown - .05);
  assert.equal(enemy.hp, 1000 - damage, 'No early second hit');
  advance(game, .08);
  assert.equal(enemy.hp, 1000 - 2 * damage, 'Second hit occurs after the cooldown');
});

check('switching weapons preserves the existing attack cooldown', () => {
  const game = playing(); add(game, 'axe'); game.equip('axe');
  const enemy = adjacentEnemy(game); game.tick(.001);
  assert.equal(enemy.hp, 946);
  game.equip('crowbar');
  near(game.player.attack, 1, 'Equipping must not reset the active cooldown');
  advance(game, .8); assert.equal(enemy.hp, 946);
  advance(game, .23); assert.equal(enemy.hp, 908, 'Next hit uses the newly held crowbar');
});

for (const [body, head, damage] of [
  [null, null, 8], ['jacket', null, 7], ['vest', null, 6],
  [null, 'helmet', 7], ['jacket', 'helmet', 6], ['vest', 'helmet', 5],
]) check(`actual incoming armor damage: ${body ?? 'no body'} / ${head ?? 'no head'}`, () => {
  const game = playing(); add(game, 'jacket', 'vest', 'helmet');
  if (body) game.equip(body);
  if (head) game.equip(head);
  const enemy=adjacentEnemy(game, true); enemy.kind='shambler'; game.tick(.001);
  assert.equal(game.health, 100 - damage, 'Only worn armor reduces the real zombie hit');
});

check('slots replace independently; equipment retains its full carry weight', () => {
  const game = playing(); game.consume('medkit'); game.consume('bottle');
  add(game, 'axe', 'jacket', 'vest', 'helmet', 'tire', 'scrap');
  near(game.weight, CAPACITY, 'Fixture fills the 14 kg backpack');
  const inventory = [...game.inventory];
  game.equip('axe'); game.equip('jacket'); game.equip('helmet');
  assert.deepEqual(game.equipment, { hand: 'axe', body: 'jacket', head: 'helmet' });
  game.equip('vest');
  assert.deepEqual(game.equipment, { hand: 'axe', body: 'vest', head: 'helmet' });
  game.equip('vest');
  assert.deepEqual(game.equipment, { hand: 'axe', body: null, head: 'helmet' });
  game.unequip('head');
  assert.deepEqual(game.equipment, { hand: 'axe', body: null, head: null });
  assert.deepEqual(game.inventory, inventory);
  near(game.weight, CAPACITY, 'Equipping and unequipping do not free backpack weight');
  assert.equal(game.addItem('medkit'), false, 'An equipped full backpack still rejects excess weight');
  assert.deepEqual(game.inventory, inventory);
});

check('unowned items, non-equipment and invalid slots cannot change the loadout', () => {
  const game = playing(); const original = { ...game.equipment };
  for (const id of ['axe', 'helmet', 'medkit', 'unknown-item']) game.equip(id);
  game.unequip('feet');
  assert.deepEqual(game.equipment, original);
  add(game, 'jacket', 'helmet'); game.use('jacket'); game.use('helmet');
  assert.deepEqual(game.equipment, { hand: 'crowbar', body: 'jacket', head: 'helmet' });
});

check('dropping duplicates preserves the slot until the last copy leaves', () => {
  const game = playing(); add(game, 'jacket', 'jacket', 'helmet');
  game.equip('jacket'); game.equip('helmet');
  game.drop('jacket');
  assert.equal(game.count('jacket'), 1); assert.equal(game.equipment.body, 'jacket');
  game.drop('jacket');
  assert.equal(game.count('jacket'), 0);
  assert.deepEqual(game.equipment, { hand: 'crowbar', body: null, head: 'helmet' });
  const dropped = game.entities.filter(e => e.id.startsWith('drop-') && e.item === 'jacket');
  assert.equal(dropped.length, 2, 'Both copies remain recoverable on the map');
  for (const entity of dropped) assert.notEqual(game.nearestPath(entity), null);
});

check('throwing the last equipped bottle clears its slot; other equipment survives', () => {
  const game = playing(); add(game, 'bottle', 'jacket');
  game.equip('bottle'); game.equip('jacket');
  game.use('bottle'); game.throwBottle(4, 15);
  assert.equal(game.count('bottle'), 1); assert.equal(game.equipment.hand, 'bottle');
  game.use('bottle'); game.throwBottle(4, 15);
  assert.equal(game.count('bottle'), 0); assert.equal(game.equipment.hand, null);
  assert.equal(game.equipment.body, 'jacket'); assert.equal(game.throwing, false);
  assert.equal(game.consume('bottle'), false, 'Consuming an absent item is harmless');
});

for (const mode of ['briefing', 'dead', 'complete', 'won']) check(`read-only equipment in ${mode} and its inventory`, () => {
  const game = playing(); add(game, 'axe', 'helmet'); game.equip('axe'); game.mode = mode;
  const equipment = { ...game.equipment }, inventory = [...game.inventory];
  for (const open of [false, true]) {
    if (open) game.openInventory();
    assert.equal(game.canManageInventory, false);
    game.equip('helmet'); game.unequip('hand'); game.use('axe'); game.drop('axe');
    assert.deepEqual(game.equipment, equipment); assert.deepEqual(game.inventory, inventory);
  }
  game.closeInventory(); assert.equal(game.mode, mode);
});

for (const returnMode of ['playing', 'paused']) check(`managed inventory equips safely and restores ${returnMode}`, () => {
  const game = playing(); add(game, 'axe', 'helmet');
  if (returnMode === 'paused') {
    game.pause(); game.equip('axe');
    assert.equal(game.equipment.hand, 'crowbar', 'A bare pause does not allow equipment actions');
  }
  game.openInventory(); assert.equal(game.canManageInventory, true);
  const time = game.time, health = game.health;
  game.equip('axe'); game.equip('helmet'); game.unequip('hand');
  assert.deepEqual(game.equipment, { hand: null, body: null, head: 'helmet' });
  advance(game, 2); assert.equal(game.time, time); assert.equal(game.health, health);
  game.start(); game.pause(); assert.equal(game.mode, 'paused', 'Inventory cannot be bypassed by resume');
  game.closeInventory(); assert.equal(game.mode, returnMode);
});

check('level transitions carry gear; restart restores independent entry equipment and inventory', () => {
  const game = playing(); add(game, 'jacket', 'helmet', 'fuse', 'fuel');
  game.equip('jacket'); game.equip('helmet');
  game.interact(game.entities.find(e => e.id === 'generator'));
  game.interact(game.entities.find(e => e.id === 'bunker'));
  assert.equal(game.mode, 'complete');
  const equipment = { ...game.equipment }, inventory = [...game.inventory];
  game.next(); assert.equal(game.level, 1); assert.deepEqual(game.equipment, equipment);
  assert.deepEqual(game.inventory, inventory); assert.notEqual(game.entries[1].equipment, game.equipment);
  game.start(); add(game, 'axe', 'vest'); game.equip('axe'); game.equip('vest');
  game.drop('jacket'); game.drop('helmet');
  assert.deepEqual(game.entries[1].equipment, equipment, 'Entry snapshot must not alias the live loadout');
  game.restart(); assert.equal(game.mode, 'briefing');
  assert.deepEqual(game.equipment, equipment); assert.deepEqual(game.inventory, inventory);
  game.start(); add(game, 'keycard', 'sample');
  game.interact(game.entities.find(e => e.id === 'roof')); game.next();
  assert.equal(game.level, 2); assert.deepEqual(game.equipment, equipment);
  game.newGame();
  assert.equal(game.level, 0); assert.equal(game.unlocked, 0);
  assert.deepEqual(game.equipment, { hand: 'crowbar', body: null, head: null });
  assert.deepEqual(game.inventory, ['crowbar', 'medkit', 'bottle']);
});

for (const [level, entityIds] of [[0, ['jacket1', 'helmet1']], [1, ['vest1', 'axe1']]]) {
  check(`new equipment can actually be reached and collected in level ${level + 1}`, () => {
    const game = new Game(); if (level !== 0) game.loadLevel(level); game.start(false);
    // Threat damage is tested above; isolate terrain/pathfinding for these pickup checks.
    game.zombies = [];
    for (const id of entityIds) {
      const entity = game.entities.find(e => e.id === id);
      assert.ok(entity, `${id} exists`); assert.equal(game.isBlocked(entity.x, entity.y), false);
      assert.notEqual(game.nearestPath(entity), null, `${id} has an approach route`);
      const count = game.count(entity.item);
      game.select(id); until(game, () => entity.removed === true, `Collect ${id}`);
      assert.equal(game.count(entity.item), count + 1);
    }
  });
}

function reachPackLesson() {
  const game = new Game({ tutorial: true }); game.start(); game.acknowledgeTutorial();
  game.move(5, 15); until(game, () => game.tutorial.index === 1, 'Complete real movement');
  game.acknowledgeTutorial(); game.select('bottle1');
  until(game, () => game.tutorial.index === 2, 'Complete actual bottle pickup');
  assert.equal(game.entities.find(e => e.id === 'bottle1').removed, true);
  return game;
}

check('tutorial records inventory opened from a pre-existing pause', () => {
  const game = reachPackLesson(); game.acknowledgeTutorial(); game.pause();
  game.openInventory(); game.closeInventory();
  assert.equal(game.mode, 'paused'); assert.equal(game.tutorial.facts.inventoryViewed, true);
  game.pause(); assert.equal(game.tutorial.index, 3);
});

check('prepared bottle survives the pack-to-survival lesson and its reading pause', () => {
  const game = reachPackLesson(); game.acknowledgeTutorial(); game.openInventory();
  game.equip('bottle'); const count = game.count('bottle'); game.use('bottle');
  assert.equal(game.inventoryOpen, false); assert.equal(game.tutorial.index, 3);
  assert.equal(game.tutorial.reading, true); assert.equal(game.throwing, true);
  const time = game.time; game.throwBottle(4, 16); advance(game, 2);
  assert.equal(game.time, time); assert.equal(game.count('bottle'), count);
  game.acknowledgeTutorial(); assert.equal(game.throwing, true);
  game.throwBottle(4, 16);
  assert.equal(game.count('bottle'), count - 1); assert.equal(game.tutorial.facts.threw, true);
  assert.equal(game.tutorial.index, 4); assert.equal(game.throwing, false);
});

check('a reached walking marker refreshes so the player can still learn to sneak', () => {
  const game = reachPackLesson(); game.acknowledgeTutorial(); game.openInventory();
  game.closeInventory(); game.acknowledgeTutorial();
  const first = tutorialTarget(game); assert.ok(first);
  game.move(first.x, first.y); until(game, () => game.path.length === 0, 'Walk to the first marker');
  assert.equal(game.tutorial.index, 3); assert.equal(game.tutorial.facts.sneakDistance, 0);
  const second = tutorialTarget(game); assert.ok(second);
  assert.ok(Math.hypot(second.x - game.player.x, second.y - game.player.y) >= 1.5);
  assert.ok(game.pathTo(game.player, second)?.length >= 2);
  game.toggleSneak(); game.move(second.x, second.y);
  until(game, () => game.tutorial.index === 4, 'Complete two tiles of actual sneaking');
  assert.ok(game.tutorial.facts.sneakDistance >= 1.99);
});

console.log(`\n${passed} passed; ${failures.length} failed.`);
if (failures.length) { console.error(`Failed: ${failures.join('; ')}`); process.exitCode = 1; }
