"use client"
import React, { useState } from "react";
import { ethers } from "ethers";
import AnonymousPoll from "@/abi/AnonymousPoll.json";



export default function CreatePollPage() {

  
    const [question, setQuestion] = useState("");
    const [txHash, setTxHash] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
  
    const createPoll = async () => {
      try {
        setError(null);
        setLoading(true);
  
        if (!window.ethereum) {
          throw new Error("MetaMask not found");
        }
  
        if (!question.trim()) {
          throw new Error("Question cannot be empty");
        }
  
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
  
        const contract = new ethers.Contract(
          AnonymousPoll.address,
          AnonymousPoll.abi,
          signer
        );
  
        const tx = await contract.createPoll(question);
        setTxHash(tx.hash);
  
        await tx.wait();
      } catch (err: any) {
        setError(err.message ?? "Transaction failed");
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-xl shadow-md rounded-2xl">
          <div className="p-6 space-y-4">
            <h1 className="text-2xl font-semibold">Create Anonymous Poll</h1>
  
            <textarea
              className="w-full p-3 border rounded-xl resize-none focus:outline-none focus:ring"
              rows={3}
              placeholder="Enter your poll question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
  
            <button
              onClick={createPoll}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Creating..." : "Create Poll"}
            </button>
  
            {txHash && (
              <p className="text-sm text-green-600 break-all">
                Transaction submitted: {txHash}
              </p>
            )}
  
            {error && (
              <p className="text-sm text-red-600">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
  