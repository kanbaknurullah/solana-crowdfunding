import {useEffect, useState} from 'react';
import idl from "./idl.json";
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import {Program, AnchorProvider, web3, utils} from '@project-serum/anchor';
import './App.css';
import {Buffer} from 'buffer';
window.Buffer = Buffer;

const programID = new PublicKey(idl.metadata.address);
const network = clusterApiUrl('devnet');
const opts = {
  preflightCommitment: "processed",
};
const {SystemProgram} = web3;

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new AnchorProvider(connection, window.solana, opts.preflightCommitment);
    return provider;
  }
  const checkIfTheWalletIsConnected = async() => {
    try {
      const {solana} = window;
      if (solana) {
        if (solana.isPhantom) {
          console.log("Phantom wallet found!")
          const response = await solana.connect({onlyIfTrusted: true});
          console.log("Connected with public key: ", response.publicKey.toString());
          setWalletAddress(response.publicKey.toString());
        }
      } else {
        alert("Solana object not found! Get a Phantom wallet")
      }
    } catch(error) {
      console.log(error);
    }
  }
  const connectWallet = async() => {
    const {solana} = window;
    if (solana) {
      const response = await solana.connect();
      console.log("Connected with public key: ", response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };

  const createCampaign = async() => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const [campaign] = await PublicKey.findProgramAddress([
        utils.bytes.utf8.encode("CAMPAIGN_DEMO"),
        provider.wallet.publicKey.toBuffer()
      ], program.programId);
      await program.rpc.create('campaign name', 'campaign description', {
        accounts: {
          campaign: campaign,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId
        }
      });
      console.log("Created a new campaign w/ address: ", campaign.toString());
    } catch (error) {
      console.log("Error creating campaign account: ", error)
    }
  }

  const renderNotConnectedContainer = () => (
    <button onClick={connectWallet}>Connect to Wallet</button>
  )
  const renderConnectedContainer = () => (
    <button onClick={createCampaign}>Create a campaign...</button>
  )
  useEffect(() => {
    const onLoad = async() => {
      await checkIfTheWalletIsConnected();
    }
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  return (
    <div className='App'>{!walletAddress ? renderNotConnectedContainer() : renderConnectedContainer()}</div>
  )
}

export default App;
