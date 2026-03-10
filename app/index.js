// Load polyfills FIRST before any other code
require('./polyfills');

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
