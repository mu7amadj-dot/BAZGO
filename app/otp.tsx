import React from 'react';
import { Redirect } from 'expo-router';

// Twilio SMS verification is handled on /login; local fixed codes are never accepted.
export default function OtpScreen() { return <Redirect href="/login" />; }
