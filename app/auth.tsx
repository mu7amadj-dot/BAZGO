import React from 'react';
import { Redirect } from 'expo-router';

// Legacy links enter the same real SMS authentication flow.
export default function AuthScreen() { return <Redirect href="/login" />; }
