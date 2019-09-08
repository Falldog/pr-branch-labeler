import path from "path";
import yaml from "js-yaml";
import * as github from "@actions/github";
import { ConfigEntry } from "./ConfigEntry";

const CONFIG_PATH = ".github";

export async function getConfig(github: github.GitHub, fileName: string, { owner, repo }): Promise<ConfigEntry[]> {
  try {
    const response = await github.repos.getContents({
      owner,
      repo,
      path: path.posix.join(CONFIG_PATH, fileName)
    });

    return parseConfig(response.data.content);
  } catch (error) {
    if (error.status === 404) {
      return [];
    }

    throw error;
  }
}

function parseConfig(content: string): ConfigEntry[] {
  const configObject = yaml.safeLoad(Buffer.from(content, "base64").toString()) || {};
  if (configObject === {}) {
    return [];
  }

  return Object.entries(configObject).reduce((entries: ConfigEntry[], [label, object]: [string, any]) => {
    const headPattern = object.head || (typeof object === "string" || Array.isArray(object) ? object : undefined);
    const basePattern = object.base;
    if (headPattern || basePattern) {
      entries.push({ label: label, head: headPattern, base: basePattern });
    } else {
      throw new Error("config.yml has invalid structure.");
    }

    return entries;
  }, []);
}