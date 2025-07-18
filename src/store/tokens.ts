import { atom } from "jotai";

// Get initial token from localStorage
const getInitialToken = (): string | null => {
  // Hardcoded token as requested
  return "3460a9d2f55f4c4dbf7d139c749e17ae";
};

// Atom to store the API token
export const apiTokenAtom = atom<string | null>(getInitialToken());

// Atom to track if token is being validated
export const isValidatingTokenAtom = atom(false);

// Derived atom to check if token exists
export const hasTokenAtom = atom((get) => get(apiTokenAtom) !== null);

// Action atom to set token
export const setApiTokenAtom = atom(null, (_, set, token: string) => {
  localStorage.setItem('tavus-token', token);
  set(apiTokenAtom, token);
});

// Action atom to clear token
export const clearApiTokenAtom = atom(null, (_, set) => {
  localStorage.removeItem('tavus-token');
  set(apiTokenAtom, null);
});
