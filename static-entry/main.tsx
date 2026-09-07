import React from 'react';
import {createRoot} from 'react-dom/client';
import GameClient from '../app/game/GameClient';
import '../app/globals.css';
import '../app/game/workbench.css';
import '../app/game/survival-hud.css';
createRoot(document.getElementById('root')!).render(<GameClient/>);
