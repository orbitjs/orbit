var Orbit = requireModule("orbit");

// Globalize loader properties for use by other Orbit packages
Orbit.__define__ = define;
Orbit.__requireModule__ = requireModule;
Orbit.__require__ = require;
Orbit.__requirejs__ = requirejs;

window.Orbit = Orbit;
