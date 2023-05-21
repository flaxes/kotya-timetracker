#!/usr/bin/env node

const electron = require("electron");

const proc = require("child_process");

proc.spawn(electron, ["."], { stdio: "inherit", windowsHide: false, detached: true });

process.exit(0);
