/**
 * Entrada programática do Versioner.
 *
 * const { ReleaseManager, createContext } = require("@carloscoding/versioner");
 */

const ReleaseManager = require("./managers/ReleaseManager");
const VersionManager = require("./managers/VersionManager");
const ConfigManager = require("./managers/ConfigManager");
const FileManager = require("./managers/FileManager");
const GitManager = require("./managers/GitManager");
const CommandRouter = require("./services/CommandRouter");

const { createContext } = require("./core/Context");
const logger = require("./utils/logger");
const constants = require("./constants");

module.exports = {
	ReleaseManager,
	VersionManager,
	ConfigManager,
	FileManager,
	GitManager,
	CommandRouter,
	createContext,
	logger,
	constants,
};