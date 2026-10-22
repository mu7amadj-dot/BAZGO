import React from 'react';
import { Redirect } from 'expo-router';

// Email verification is handled on /login; local phone codes are no longer accepted.
export default function OtpScreen() { return <Redirect href="/login" />; }
