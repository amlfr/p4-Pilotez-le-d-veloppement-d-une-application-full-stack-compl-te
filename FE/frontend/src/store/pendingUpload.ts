// Hands the file picked on the Home page over to the Upload page.
// A File object can't travel through router navigation state, so it
// briefly lives here in module scope during the redirect.

let pendingFile: File | null = null;

export function setPendingFile(file: File) {
  pendingFile = file;
}

export function peekPendingFile(): File | null {
  return pendingFile;
}

export function clearPendingFile() {
  pendingFile = null;
}
