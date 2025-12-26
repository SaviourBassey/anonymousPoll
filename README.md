### AnonymousPoll

A privacy-preserving polling system built on Ethereum using Zama's Fully Homomorphic Encryption (FHE) technology. This contract enables truly anonymous voting where individual votes remain encrypted while still allowing for accurate vote counting.

#### Features
 - Fully Anonymous Voting: Individual votes are encrypted and never revealed publicly
 - Verifiable Results: Vote tallies can be computed on encrypted data
 - One Vote Per Address: Each Ethereum address can only vote once per poll
 - Personal Vote Retrieval: Users can retrieve their own encrypted vote
 - Simple Yes/No Polls: Clean binary voting mechanism.

#### How It Works
The contract uses Zama's FHE library to perform computations on encrypted data:
 - Poll Creation: Anyone can create a new yes/no poll with a question
 - Encrypted Voting: Users submit encrypted votes (0 for No, 1 for Yes)
 - Homomorphic Counting: Vote tallies are updated without decrypting individual votes
 - Privacy Preservation: Only the user can decrypt their own vote; aggregated results can be made public.

#### Contract Structure
```
Poll Struct
struct Poll {
    string question;        // The poll question
    euint64 numYesVotes;   // Encrypted count of Yes votes
    euint64 numNoVotes;    // Encrypted count of No votes
    uint64 totalVotes;     // Public total vote count
}
UserVote Struct
struct UserVote {
    bool isVoted;      // Has this address voted?
    euint64 vote;      // Encrypted vote value (0 or 1)
}
```

#### Key Functions
 - createPoll(string calldata question): Creates a new poll with the specified question.
Parameters:

 - vote(uint256 pollId, externalEuint64 encryptedVote, bytes calldata proof): Submit an encrypted vote to a poll.

 - myVote(uint256 pollId): Retrieve your own encrypted vote for a specific poll.

Dependencies

Solidity ^0.8.27

@fhevm/solidity - Zama's FHE library for Solidity
Zama Ethereum Config.

License

MIT

