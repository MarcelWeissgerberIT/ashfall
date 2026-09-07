// Run: node scripts/check-loot.mjs
// Imports the current checkout. Only in-memory Game fixtures are modified.
import assert from 'node:assert/strict';
import { Game, CAPACITY, LEVELS } from '../app/game/engine.mjs';

let passed = 0;
const failed = [];
function test(name, run) {
  try { run(); passed++; console.log('PASS ' + name); }
  catch (error) { failed.push(name); console.error('FAIL ' + name + '\n' + error.stack); }
}
function near(a, b, message) { assert.ok(Math.abs(a - b) < 1e-8, message + ': ' + a + ' !== ' + b); }
function setup(level = 0) {
  const game = new Game();
  if (level) game.loadLevel(level);
  game.start(false);
  // Enemy combat has its own regression suite; isolate terrain and transfer behavior here.
  game.zombies = [];
  return game;
}
function add(game, ...items) {
  for (const id of items) assert.equal(game.addItem(id), true, 'Fixture item must fit: ' + id);
}
function entity(game, id) {
  const value = game.entities.find(e => e.id === id);
  assert.ok(value, 'Entity exists: ' + id); return value;
}
function tickUntil(game, done, label, limit = 7200) {
  for (let i = 0; i < limit && !done(); i++) {
    game.tick(1 / 60);
    assert.equal(game.isBlocked(Math.round(game.player.x), Math.round(game.player.y)), false,
      'Actual movement entered collision geometry while ' + label);
  }
  assert.ok(done(), label + '; mode=' + game.mode + ', path=' + game.path.length);
}
function walk(game, point) {
  assert.notEqual(game.pathTo(game.player, point), null, 'Destination must be reachable');
  game.move(point.x, point.y);
  tickUntil(game, () => !game.path.length, 'walking to ' + point.x + ',' + point.y);
  near(game.player.x, point.x, 'Arrived x'); near(game.player.y, point.y, 'Arrived y');
}
function search(game, id) {
  const target = entity(game, id);
  assert.equal(game.mode, 'playing');
  assert.notEqual(game.nearestPath(target), null, 'Container approach exists: ' + id);
  game.select(id);
  tickUntil(game, () => game.lootOpen, 'opening ' + id);
  assert.equal(game.lootContainerId, id);
  assert.equal(game.lootContainer, target);
  return target;
}
function snapshot(game) {
  return {
    bag: [...game.inventory], equipment: { ...game.equipment },
    containers: game.entities.filter(e => e.type === 'container').map(e => [e.id, [...e.contents]]),
    loose: game.entities.filter(e => e.type === 'item' && !e.removed).map(e => [e.id, e.item]),
  };
}
function totalItems(game) {
  const all = [...game.inventory];
  for (const e of game.entities) {
    if (e.removed) continue;
    if (e.type === 'container') all.push(...e.contents);
    if (e.type === 'item') all.push(e.item);
  }
  return Object.fromEntries([...new Set(all)].sort().map(id => [id, all.filter(v => v === id).length]));
}
function footprint(game, target) {
  for (let x = target.x; x < target.x + (target.w || 1); x++) {
    for (let y = target.y; y < target.y + (target.h || 1); y++) {
      assert.equal(game.isBlocked(x, y), true, target.id + ' must retain collision at ' + x + ',' + y);
    }
  }
}

test('opening a real crate pauses without collecting or changing its contents', () => {
  const game = setup(), target = entity(game, 'guard');
  const inventory = [...game.inventory], contents = [...target.contents], weight = game.weight;
  search(game, 'guard');
  assert.equal(target.open, true); assert.equal(game.mode, 'paused');
  assert.deepEqual(target.contents, contents); assert.deepEqual(game.inventory, inventory);
  assert.equal(game.has('fuse'), false, 'Search alone does not award the quest item');
  near(game.weight, weight, 'Search does not change carry weight'); footprint(game, target);
  const frozen = { time: game.time, health: game.health, x: game.player.x, y: game.player.y };
  for (let i = 0; i < 240; i++) game.tick(1 / 60);
  assert.deepEqual({ time: game.time, health: game.health, x: game.player.x, y: game.player.y }, frozen);
  game.start(); game.pause(); game.openInventory();
  assert.equal(game.mode, 'paused'); assert.equal(game.lootOpen, true);
  assert.equal(game.inventoryOpen, false, 'Loot and ordinary inventory cannot overlap');
  game.closeInventory();
  assert.equal(game.mode, 'playing'); assert.equal(game.lootOpen, false);
  assert.equal(game.lootContainer, null); assert.equal(game.lootContainerId, null);
  assert.deepEqual(target.contents, contents); footprint(game, target);
});

test('explicit take removes one matching copy and conserves all world items', () => {
  const game = setup(); const target = search(game, 'car1');
  assert.equal(game.storeLoot('bottle'), true);
  assert.equal(target.contents.filter(id => id === 'bottle').length, 2);
  const total = totalItems(game), count = game.count('bottle');
  assert.equal(game.takeLoot('bottle'), true);
  assert.equal(game.count('bottle'), count + 1);
  assert.equal(target.contents.filter(id => id === 'bottle').length, 1);
  assert.deepEqual(totalItems(game), total);
  assert.equal(game.mode, 'paused'); assert.equal(game.lootOpen, true);
});

test('take-all skips overweight loot, takes later fitting loot, and leaves recoverable leftovers', () => {
  const game = setup();
  add(game, 'tire', 'tire', 'crowbar', 'helmet', 'ration');
  near(game.weight, 13.6, 'Fixture carry weight');
  const target = search(game, 'wreck'), total = totalItems(game);
  const bottles = game.count('bottle');
  game.takeAllLoot();
  near(game.weight, CAPACITY, 'Later bottle fits exactly');
  assert.equal(game.count('bottle'), bottles + 1);
  assert.equal(game.has('fuel'), false); assert.deepEqual(target.contents, ['fuel']);
  const fullState = snapshot(game);
  assert.equal(game.takeLoot('fuel'), false);
  game.takeAllLoot(); assert.deepEqual(snapshot(game), fullState);
  assert.equal(game.storeLoot('tire'), true);
  assert.equal(game.takeLoot('fuel'), true);
  assert.deepEqual(target.contents, ['tire']);
  assert.equal(game.has('fuel'), true); assert.ok(game.weight <= CAPACITY + 1e-8);
  assert.deepEqual(totalItems(game), total);
});

test('stored items persist when the container is closed and reopened', () => {
  const game = setup(); add(game, 'jacket', 'jacket'); game.equip('jacket');
  const target = search(game, 'guard'), total = totalItems(game);
  assert.equal(game.storeLoot('jacket'), true);
  assert.equal(game.count('jacket'), 1);
  assert.equal(game.equipment.body, 'jacket', 'Bag STORE may retain the other equipped copy');
  const stored = [...target.contents]; game.closeInventory(); search(game, 'guard');
  assert.deepEqual(target.contents, stored);
  assert.equal(game.takeLoot('jacket'), true);
  assert.equal(game.count('jacket'), 2); assert.deepEqual(totalItems(game), total);
});

for (const [id, slot] of [['crowbar', 'hand'], ['jacket', 'body'], ['helmet', 'head']]) {
  for (const destination of ['loot', 'ground']) {
    test('dragging duplicate equipped ' + id + ' to ' + destination + ' clears the source slot', () => {
      const game = setup();
      if (id === 'crowbar') add(game, id);
      else { add(game, id, id); game.equip(id); }
      const target = search(game, 'guard'), total = totalItems(game);
      const oldContents = target.contents.filter(v => v === id).length;
      const oldLoose = game.entities.filter(e => !e.removed && e.type === 'item' && e.item === id).length;
      assert.equal(game.count(id), 2); assert.equal(game.equipment[slot], id);
      assert.equal(game.transferItem(id, slot, destination), true);
      assert.equal(game.count(id), 1);
      assert.equal(game.equipment[slot], null, 'Dragged equipped copy leaves the slot even with another bag copy');
      if (destination === 'loot') assert.equal(target.contents.filter(v => v === id).length, oldContents + 1);
      else assert.equal(game.entities.filter(e => !e.removed && e.type === 'item' && e.item === id).length, oldLoose + 1);
      assert.deepEqual(totalItems(game), total);
    });
  }
}

test('slot-to-bag unequips without duplicating; loot-to-slot takes and equips exactly one item', () => {
  const game = setup(); add(game, 'helmet'); const target = search(game, 'guard');
  assert.equal(game.storeLoot('helmet'), true);
  const total = totalItems(game), count = game.inventory.length;
  assert.equal(game.transferItem('helmet', 'loot', 'head'), true);
  assert.equal(game.equipment.head, 'helmet'); assert.equal(game.count('helmet'), 1);
  assert.equal(target.contents.includes('helmet'), false); assert.equal(game.inventory.length, count + 1);
  const bag = [...game.inventory];
  assert.equal(game.transferItem('helmet', 'head', 'bag'), true);
  assert.equal(game.equipment.head, null); assert.deepEqual(game.inventory, bag);
  assert.deepEqual(totalItems(game), total);
});

test('loot-to-slot respects weight and does not overwrite the existing slot on failure', () => {
  const game = setup();
  add(game, 'jacket', 'vest'); game.equip('jacket'); const target = search(game, 'wreck');
  assert.equal(game.storeLoot('vest'), true);
  add(game, 'tire', 'tire', 'crowbar'); near(game.weight, 13.4, 'Fixture is too heavy to retake the vest');
  const before = snapshot(game);
  assert.equal(game.transferItem('vest', 'loot', 'body'), false);
  assert.deepEqual(snapshot(game), before); assert.equal(target.contents.includes('vest'), true);
  assert.equal(game.equipment.body, 'jacket');
});

test('wrong-slot, missing-source and invalid transfers never lose or duplicate items', () => {
  const game = setup(); add(game, 'jacket', 'helmet'); game.equip('jacket');
  search(game, 'guard'); game.storeLoot('helmet');
  const cases = [
    ['helmet', 'loot', 'body'], ['fuse', 'loot', 'hand'], ['jacket', 'bag', 'head'],
    ['jacket', 'hand', 'loot'], ['jacket', 'feet', 'bag'], ['jacket', 'bag', 'void'],
    ['jacket', 'loot', 'bag'], ['fuel', 'bag', 'loot'], ['unknown', 'bag', 'ground'],
    ['helmet', 'head', 'bag'], ['fuse', 'loot', 'ground'], ['fuse', 'loot', 'loot'],
  ];
  for (const [id, from, to] of cases) {
    const before = snapshot(game);
    assert.equal(game.transferItem(id, from, to), false, [id, from, to].join(' / '));
    assert.deepEqual(snapshot(game), before, 'No mutation for ' + [id, from, to].join(' / '));
  }
  const before = snapshot(game);
  assert.equal(game.takeLoot('axe'), false); assert.equal(game.storeLoot('fuel'), false);
  assert.deepEqual(snapshot(game), before);
});

test('remote and closed-container transfer attempts are rejected without loss', () => {
  const game = setup(), target = entity(game, 'guard'), before = snapshot(game);
  game.openLoot(target); assert.equal(game.lootOpen, false, 'Cannot remotely open a container');
  assert.equal(game.takeLoot('fuse'), false); assert.equal(game.storeLoot('crowbar'), false);
  assert.equal(game.transferItem('crowbar', 'bag', 'loot'), false);
  assert.equal(game.transferItem('fuse', 'loot', 'bag'), false);
  assert.deepEqual(snapshot(game), before);
});

function unlockLab(game) {
  add(game, 'keycard');
  const door = entity(game, 'lab-door'); game.select(door.id);
  tickUntil(game, () => door.open === true, 'unlocking the laboratory for furniture access');
  assert.equal(game.mode, 'playing');
}
function perimeter(target) {
  const w = target.w || 1, h = target.h || 1, cells = [];
  for (let x = target.x; x < target.x + w; x++) {
    cells.push({ x, y: target.y - 1, side: 'north' }, { x, y: target.y + h, side: 'south' });
  }
  for (let y = target.y; y < target.y + h; y++) {
    cells.push({ x: target.x - 1, y, side: 'west' }, { x: target.x + w, y, side: 'east' });
  }
  return cells;
}
for (const [level, id] of [[0, 'car1'], [0, 'car2'], [1, 'bed1'], [1, 'bed2'], [1, 'desk1'], [1, 'desk2']]) {
  test(id + ' opens from every reachable perimeter cell using real movement', () => {
    const game = setup(level); if (level === 1) unlockLab(game);
    const target = entity(game, id), contents = [...target.contents], bag = [...game.inventory];
    assert.equal(target.type, 'container'); assert.equal(target.solid, true);
    const original = { x: target.x, y: target.y, w: target.w, h: target.h };
    const cells = perimeter(target).filter(p => !game.isBlocked(p.x, p.y) && game.pathTo(game.data.start, p) !== null);
    assert.ok(cells.length, 'At least one perimeter cell is reachable');
    const sides = new Set();
    for (const point of cells) {
      walk(game, point); sides.add(point.side); search(game, id);
      assert.deepEqual(target.contents, contents); assert.deepEqual(game.inventory, bag);
      assert.deepEqual({ x: target.x, y: target.y, w: target.w, h: target.h }, original);
      footprint(game, target); game.closeInventory();
    }
    assert.equal(sides.size, 4, 'Current map supports all four approaches for ' + id);
    console.log('  ' + cells.length + ' perimeter cells checked; all four sides');
  });
}

test('restart restores all container contents, entry inventory and entry equipment', () => {
  const game = setup(), containers = game.entities.filter(e => e.type === 'container').map(e => [e.id, [...e.contents]]);
  const entryBag = [...game.inventory], entryEquipment = { ...game.equipment };
  search(game, 'guard'); game.takeLoot('fuse'); game.storeLoot('crowbar'); game.closeInventory();
  search(game, 'car1'); game.takeAllLoot(); game.storeLoot('medkit');
  game.restart();
  assert.equal(game.mode, 'briefing'); assert.equal(game.lootOpen, false); assert.equal(game.inventoryOpen, false);
  assert.equal(game.lootContainerId, null); assert.equal(game.inventoryReturnMode, null);
  assert.deepEqual(game.inventory, entryBag); assert.deepEqual(game.equipment, entryEquipment);
  assert.deepEqual(game.entities.filter(e => e.type === 'container').map(e => [e.id, [...e.contents]]), containers);
  assert.equal(game.entities.filter(e => e.type === 'container').some(e => e.open), false);
  assert.deepEqual(LEVELS[0].entities.filter(e => e.type === 'container').map(e => [e.id, [...e.contents]]), containers,
    'Live searches must never mutate the level template');
});

for (const mode of ['briefing', 'dead', 'complete', 'won']) {
  test('inventory and loot remain read-only from ' + mode, () => {
    const game = setup(); add(game, 'helmet'); const target = search(game, 'guard');
    game.closeInventory(); game.mode = mode;
    const before = snapshot(game);
    game.openLoot(target); assert.equal(game.lootOpen, false);
    game.openInventory(); assert.equal(game.canManageInventory, false);
    game.equip('helmet'); game.unequip('hand'); game.drop('crowbar'); game.use('medkit');
    assert.equal(game.takeLoot('fuse'), false); game.takeAllLoot();
    assert.equal(game.storeLoot('crowbar'), false);
    assert.equal(game.transferItem('crowbar', 'hand', 'ground'), false);
    assert.equal(game.transferItem('helmet', 'bag', 'head'), false);
    assert.deepEqual(snapshot(game), before);
    game.closeInventory(); assert.equal(game.mode, mode);
  });
}

console.log('\n' + passed + ' passed; ' + failed.length + ' failed.');
if (failed.length) { console.error('Failed: ' + failed.join('; ')); process.exitCode = 1; }
