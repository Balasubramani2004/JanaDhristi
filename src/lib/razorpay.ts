/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * JanaDhristi — MIT License with Attribution.
 * https://github.com/Balasubramani2004/JanaDhristi
 */

import Razorpay from "razorpay";

let client: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!client) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set");
    }
    client = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return client;
}

