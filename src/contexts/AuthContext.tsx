// Re-export useAuth as AuthProvider context is handled inside useAuth hook directly.
// This file exists to satisfy App.tsx import; wrap children in a plain React fragment.
import React from 'react';
import { View } from 'react-native';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
