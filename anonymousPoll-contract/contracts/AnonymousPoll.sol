// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import { FHE, euint64, externalEuint64, ebool } from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";


contract AnonymousPoll is ZamaEthereumConfig {
    using FHE for euint64;

    struct Poll {
        string question;
        euint64 numYesVotes; 
        euint64 numNoVotes;
        uint64 totalVotes;
    }

    struct UserVote {
        bool isVoted;
        euint64 vote; // encrypted 0 or 1
    }

    uint256 public pollCount;
    mapping(uint256 => Poll) public polls;

    mapping(uint256 => mapping(address => UserVote)) public hasVoted;



    event PollCreated(uint256 indexed pollId, string question);
    event VoteSubmitted(uint256 indexed pollId);
    event ResultsDecrypted(
        uint256 indexed pollId,
        uint64 yesVotes,
        uint64 noVotes,
        uint64 totalVotes
    );


    function createPoll(
        string calldata question
    ) external returns (uint256 pollId) {
        pollId = pollCount++;

        Poll storage p = polls[pollId];
        p.question = question;

        // Initialize encrypted counters
        p.numYesVotes = FHE.asEuint64(0);
        p.numNoVotes = FHE.asEuint64(0);

        FHE.allowThis(p.numNoVotes);
        FHE.makePubliclyDecryptable(p.numNoVotes);
        FHE.allowThis(p.numYesVotes);
        FHE.makePubliclyDecryptable(p.numYesVotes);

        emit PollCreated(pollId, question);
    }



    /**
     * @param encryptedVote encrypted value:
     *        1 = YES
     *        0 = NO
     */
    function vote(
        uint256 pollId,
        externalEuint64 encryptedVote,
        bytes calldata proof
    ) external {
        Poll storage p = polls[pollId];

        require(!hasVoted[pollId][msg.sender].isVoted, "Already voted");

        // Convert encrypted input
        euint64 voteValue = FHE.fromExternal(encryptedVote, proof);

        ebool is0 = FHE.eq(voteValue, 0);
        ebool is1 = FHE.eq(voteValue, 1);
        ebool isValid = FHE.or(is0, is1);
        p.numNoVotes = FHE.select(
            is0,
            FHE.add(p.numNoVotes, 1),
            p.numNoVotes
        );
        p.numYesVotes = FHE.select(
            is1,
            FHE.add(p.numYesVotes, 1),
            p.numYesVotes
        );
        FHE.allowThis(p.numNoVotes);
        FHE.makePubliclyDecryptable(p.numNoVotes);
        FHE.allowThis(p.numYesVotes);
        FHE.makePubliclyDecryptable(p.numYesVotes);

        p.totalVotes += 1;
        
        hasVoted[pollId][msg.sender].isVoted = true;
        hasVoted[pollId][msg.sender].vote = voteValue;

        FHE.allowThis(hasVoted[pollId][msg.sender].vote);
        FHE.allow(hasVoted[pollId][msg.sender].vote, msg.sender);

        emit VoteSubmitted(pollId);
    }


    function myVote(uint256 pollId) public view returns(euint64) {
        return hasVoted[pollId][msg.sender].vote;
    }
}