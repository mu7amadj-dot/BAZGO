import React from 'react';
import { Redirect } from 'expo-router';

// Legacy links now enter the same real email authentication flow.
export default function AuthScreen() { return <Redirect href="/login" />; }
