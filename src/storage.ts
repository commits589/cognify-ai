// src/storage.ts
//
// Firebase Storage helper. Used by Homework Helper (and anywhere else the
// user attaches a file) to persist the actual file — separate from sending a
// base64 copy of small files/images to Gemini for the AI to read in the same
// request. Storage keeps a durable, re-downloadable record; Gemini just gets
// the bytes it needs to answer.

import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase";

export async function uploadUserFile(uid: string, file: File, folder = "uploads"): Promise<{ url: string; path: string }> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${folder}/${uid}/${Date.now()}_${safeName}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { contentType: file.type || "application/octet-stream" });
  const url = await getDownloadURL(storageRef);
  return { url, path };
}

export async function deleteUserFile(path: string): Promise<void> {
  await deleteObject(ref(storage, path));
}
