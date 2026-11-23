// Native file access for export and restore. The native modules are required
// lazily so screens (and their tests) never load them until a file is needed.

function blobFs() {
  return require('react-native-blob-util').default.fs;
}

export type SaveResult = 'saved' | 'cancelled';

function isCancelled(error: unknown): boolean {
  const {
    errorCodes,
    isErrorWithCode,
  } = require('@react-native-documents/picker');
  return (
    isErrorWithCode(error) &&
    (error as { code: string }).code === errorCodes.OPERATION_CANCELED
  );
}

// Writes the content to a temporary file and opens the system "save as" dialog,
// so the user decides where it goes (Files, Drive, ...). The temp file is removed.
export async function saveFile(options: {
  fileName: string;
  mimeType: string;
  content: string;
  encoding: 'utf8' | 'base64';
}): Promise<SaveResult> {
  const fs = blobFs();
  const { saveDocuments } = require('@react-native-documents/picker');
  const path = `${fs.dirs.CacheDir}/${options.fileName}`;
  await fs.writeFile(path, options.content, options.encoding);
  try {
    const [result] = await saveDocuments({
      sourceUris: [`file://${path}`],
      mimeType: options.mimeType,
      fileName: options.fileName,
    });
    if (result.error) {
      throw new Error(result.error);
    }
    return 'saved';
  } catch (error) {
    if (isCancelled(error)) {
      return 'cancelled';
    }
    throw error;
  } finally {
    fs.unlink(path).catch(() => undefined);
  }
}

// Lets the user choose a file and returns its text, or null if they cancel.
export async function pickTextFile(): Promise<string | null> {
  const fs = blobFs();
  const {
    pick,
    keepLocalCopy,
    types,
  } = require('@react-native-documents/picker');
  let picked: { uri: string; name: string | null }[];
  try {
    picked = await pick({
      type: [types.json, types.plainText, types.allFiles],
    });
  } catch (error) {
    if (isCancelled(error)) {
      return null;
    }
    throw error;
  }
  const [file] = picked;
  const [copy] = await keepLocalCopy({
    files: [{ uri: file.uri, fileName: file.name ?? 'backup.json' }],
    destination: 'cachesDirectory',
  });
  if (copy.status !== 'success') {
    throw new Error(copy.copyError);
  }
  const path = decodeURIComponent(copy.localUri.replace(/^file:\/\//, ''));
  try {
    return await fs.readFile(path, 'utf8');
  } finally {
    fs.unlink(path).catch(() => undefined);
  }
}
