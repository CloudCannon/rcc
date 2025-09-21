import fs from "fs";
import YAML from "yaml";

async function isDirectory(filePath) {
  const stats = await fs.promises.stat(filePath);
  return stats.isDirectory();
}

async function fileExists(filePath) {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

async function readFile(filePath, fallbackString) {
  try {
    const buffer = await fs.promises.readFile(filePath);
    return buffer.toString("utf-8") || fallbackString;
  } catch (err) {
    if (err.code === "ENOENT") {
      return fallbackString;
    }
    console.log(`Error reading ${filePath}`);
    throw err;
  }
}

async function readYaml(filePath, fallbackString) {
  try {
    const buffer = await fs.promises.readFile(filePath);
    return YAML.parse(buffer.toString("utf-8")) || fallbackString;
  } catch (err) {
    if (err.code === "ENOENT") {
      return fallbackString;
    }
    console.log(`Error reading ${filePath}`);
    throw err;
  }
}

async function readJSON(filePath) {
  const buffer = await fs.promises.readFile(filePath);
  return JSON.parse(buffer);
}

export { isDirectory, readFile, readJSON, readYaml, fileExists };
