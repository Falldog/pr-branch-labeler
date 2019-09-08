"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const config_1 = require("./config");
const matcher_1 = __importDefault(require("matcher"));
const CONFIG_FILENAME = "pr-branch-labeler.yml";
const defaults = [
    { label: "feature", head: "feature/*", base: undefined },
    { label: "bugfix", head: ["bugfix/*", "hotfix/*"], base: undefined },
    { label: "chore", head: "chore/*", base: undefined }
];
// Export the context to be able to mock the payload during tests.
exports.context = github.context;
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const repoToken = core.getInput("repo-token", { required: true });
            if (exports.context && exports.context.payload && exports.context.payload.repository && exports.context.payload.pull_request) {
                const octokit = new github.GitHub(repoToken);
                const repoConfig = yield config_1.getConfig(octokit, CONFIG_FILENAME, exports.context.repo);
                const config = repoConfig.length > 0 ? repoConfig : defaults;
                const headRef = exports.context.payload.pull_request.head.ref;
                const baseRef = exports.context.payload.pull_request.base.ref;
                const labelsToAdd = config.reduce((labels, entry) => {
                    if (entry.head && entry.base) {
                        if (isMatch(headRef, entry.head) && isMatch(baseRef, entry.base)) {
                            labels.push(entry.label);
                        }
                    }
                    else if (entry.head && isMatch(headRef, entry.head)) {
                        labels.push(entry.label);
                    }
                    else if (entry.base && isMatch(baseRef, entry.base)) {
                        labels.push(entry.label);
                    }
                    return labels;
                }, []);
                if (labelsToAdd.length > 0) {
                    core.debug(`Adding labels: ${labelsToAdd}`);
                    yield octokit.issues.addLabels(Object.assign({ issue_number: exports.context.payload.pull_request.number, labels: labelsToAdd }, exports.context.repo));
                }
            }
        }
        catch (error) {
            core.setFailed(error.message);
            throw error;
        }
    });
}
exports.run = run;
function isMatch(ref, patterns) {
    return Array.isArray(patterns)
        ? patterns.some(pattern => matcher_1.default.isMatch(ref, pattern))
        : matcher_1.default.isMatch(ref, patterns);
}
run();