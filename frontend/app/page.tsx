

"use client";
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import AnonymousPoll from "@/abi/AnonymousPoll.json";
import { useFhe } from "@/components/FheProvider";


interface Poll {
  id: number;
  question: string;
  totalVotes: number;
  yesHandle: string;
  noHandle: string;
}

export default function PollsPage() {
  const fhe = useFhe();

  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);

  const [txStatus, setTxStatus] = useState<string>("");
  const [decrypting, setDecrypting] = useState<number | null>(null);

  const [myVotes, setMyVotes] = useState<Record<number, number>>({});
  const [publicResults, setPublicResults] = useState<
    Record<number, { yes: number; no: number }>
  >({});

  /* -------------------------------------------------------------------------- */
  /*                                   FETCH                                    */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    let mounted = true;

    async function fetchPolls() {
      try {
        setLoading(true);
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(
          AnonymousPoll.address,
          AnonymousPoll.abi,
          provider
        );

        const count = Number(await contract.pollCount());
        if (count === 0) return;

        const calls = Array.from({ length: count }, (_, i) => contract.polls(i));
        const results = await Promise.all(calls);

        const parsed: Poll[] = results.map((p: any, i: number) => ({
          id: i,
          question: p.question,
          totalVotes: Number(p.totalVotes),
          yesHandle: p.numYesVotes,
          noHandle: p.numNoVotes,
        }));

        if (mounted) setPolls(parsed);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchPolls();
    return () => {
      mounted = false;
    };
  }, []);


  async function vote(pollId: number, choice: 0 | 1) {
    try {
      setTxStatus("Encrypting vote...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      const encrypted = await fhe
        .createEncryptedInput(AnonymousPoll.address, userAddress)
        .add64(choice)
        .encrypt();

      const contract = new ethers.Contract(
        AnonymousPoll.address,
        AnonymousPoll.abi,
        signer
      );

      setTxStatus("Submitting vote...");
      const tx = await contract.vote(
        pollId,
        encrypted.handles[0],
        encrypted.inputProof
      );
      await tx.wait();

      setTxStatus("Vote submitted ✅");
    } catch (err: any) {
      console.error(err);
      setTxStatus("❌ Vote failed");
    }
  }

  
  async function decryptMyVote(pollId: number) {
    try {
      setDecrypting(pollId);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(
        AnonymousPoll.address,
        AnonymousPoll.abi,
        signer
      );

      const handle = await contract.myVote(pollId);

      const keypair = fhe.generateKeypair();
      const start = Math.floor(Date.now() / 1000).toString();
      const duration = "1";
      const contracts = [AnonymousPoll.address];

      const eip712 = fhe.createEIP712(
        keypair.publicKey,
        contracts,
        start,
        duration
      );

      const signature = await signer.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message
      );

      const result = await fhe.userDecrypt(
        [{ handle, contractAddress: AnonymousPoll.address }],
        keypair.privateKey,
        keypair.publicKey,
        signature.replace("0x", ""),
        contracts,
        await signer.getAddress(),
        start,
        duration
      );

      setMyVotes((prev) => ({ ...prev, [pollId]: Number(result[handle]) }));
    } catch (err) {
      console.error(err);
    } finally {
      setDecrypting(null);
    }
  }

  
  async function publicDecrypt(pollId: number) {
    try {
      setDecrypting(pollId);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // const yes = await fhe.publicDecrypt(poll.yesHandle, provider);
      // const no = await fhe.publicDecrypt(poll.noHandle, provider);
      const handle =  await fhe.publicDecrypt(poll.yesHandle, provider);

      setPublicResults((prev) => ({
        ...prev,
        [poll.id]: { yes: Number(yes), no: Number(no) },
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setDecrypting(null);
    }
  }

 
  return (
    <div className="bg-white max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Anonymous Polls</h1>

      {loading && <p>Loading polls...</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {polls.map((poll) => (
          <div key={poll.id} className="rounded-2xl">
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-semibold">{poll.question}</h2>

              <p className="text-sm text-muted-foreground">
                Total votes: {poll.totalVotes}
              </p>

              {/* VOTE */}
              <div className="flex gap-3">
                <button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 rounded-lg transition" onClick={() => vote(poll.id, 1)}>Vote YES</button>
                <button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 rounded-lg transition" onClick={() => vote(poll.id, 0)}>
                  Vote NO
                </button>
              </div>

              {/* MY VOTE */}
              <div className="p-3 border rounded-xl">
                <p className="font-medium">My vote</p>
                {myVotes[poll.id] !== undefined ? (
                  <p className="text-green-600">
                    {myVotes[poll.id] === 1 ? "YES" : "NO"}
                  </p>
                ) : (
                  <button
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 rounded-lg transition"
                    onClick={() => decryptMyVote(poll.id)}
                    disabled={decrypting === poll.id}
                  >
                    {decrypting === poll.id ? "Decrypting..." : "Decrypt my vote"}
                  </button>
                )}
              </div>

              {/* PUBLIC RESULTS */}
              <div className="p-3 border rounded-xl">
                <p className="font-medium">Public results</p>
                {publicResults[poll.id] ? (
                  <p>
                    YES: {publicResults[poll.id].yes} | NO:{" "}
                    {publicResults[poll.id].no}
                  </p>
                ) : (
                  <button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 rounded-lg transition"               
                    onClick={() => publicDecrypt(poll.id)}
                    disabled={decrypting === poll.id}
                  >
                    {decrypting === poll.id
                      ? "Decrypting..."
                      : "Public decrypt results"}
                  </button>
                )}
              </div>

              {txStatus && <p className="text-sm">{txStatus}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
