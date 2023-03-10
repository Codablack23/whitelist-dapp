import Head from 'next/head'
import Image from 'next/image'
import { Inter } from '@next/font/google'
import styles from '@/styles/Home.module.css'
import Web3Modal from 'web3modal'
import {providers,Contract} from 'ethers'
import { useEffect, useRef, useState } from "react";
import {WHITELIST_CONTRACT_ADDRESS,abi } from '../constants'
const inter = Inter({ subsets: ['latin'] })


export default function Home() {
    // walletConnected keep track of whether the user's wallet is connected or not
    const [walletConnected, setWalletConnected] = useState(false);
    // joinedWhitelist keeps track of whether the current metamask address has joined the Whitelist or not
    const [joinedWhitelist, setJoinedWhitelist] = useState(false);
    // loading is set to true when we are waiting for a transaction to get mined
    const [loading, setLoading] = useState(false);
    // numberOfWhitelisted tracks the number of addresses's whitelisted
    const [numberOfWhitelisted, setNumberOfWhitelisted] = useState(0);
    // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
    const web3ModalRef = useRef<Web3Modal>();

    const getProviderOrSigner = async (needSigner = false)=>{
  
      const provider = await web3ModalRef.current?.connect()
      const web3Provider = new providers.Web3Provider(provider)
      const {chainId} = await web3Provider.getNetwork()
      if(chainId !== 5){
        window.alert("Change the network to Goerli");
        throw new Error("Change network to Goerli");
      }
      if(needSigner){
        const signer =  web3Provider.getSigner()
        return signer
      }
      return web3Provider
    }

    const addAddressToWhitelist = async ()=>{
      try {
        const signer = await getProviderOrSigner(true)
        const whitelistContract = new Contract(
          WHITELIST_CONTRACT_ADDRESS,
          abi,
          signer
        )
        const tx = await whitelistContract.addAddressToWhitelist()
        setLoading(true)
        await tx.wait()
        setLoading(false)
        await getNumberOfWhitelisted();
         setJoinedWhitelist(true);
      } catch (error) {
        console.log(error)
      }
    }

    const getNumberOfWhitelisted = async ()=>{
      try {
        const provider = await getProviderOrSigner()
        const whitelistContract = new Contract(
          WHITELIST_CONTRACT_ADDRESS,
          abi,
          provider
        )
        const _numberOfWhitelisted = await whitelistContract.numAddressesWhitelisted();
        setNumberOfWhitelisted(_numberOfWhitelisted)
      } catch (error) {
        console.log(error)
      }
    }
    const checkIfAddressInWhitelist = async ()=>{
      try {
        const signer = await getProviderOrSigner(true)
        const whitelistContract = new Contract(
          WHITELIST_CONTRACT_ADDRESS,
          abi,
          signer
        )
        const address = await (signer as providers.JsonRpcSigner).getAddress()
        const _joinedWhitelist = await whitelistContract.whitelistedAddresses(
          address
        );
        setJoinedWhitelist(_joinedWhitelist)
      } catch (error) {
        console.log(error)
        
      }
    }
    const connectWallet = async () => {
      try {
        // Get the provider from web3Modal, which in our case is MetaMask
        // When used for the first time, it prompts the user to connect their wallet
        await getProviderOrSigner();
        setWalletConnected(true);
  
        checkIfAddressInWhitelist();
        getNumberOfWhitelisted();
      } catch (err) {
        console.error(err);
      }
    };
    const renderButton = () => {
      if (walletConnected) {
        if (joinedWhitelist) {
          return (
            <div className={styles.description}>
              Thanks for joining the Whitelist!
            </div>
          );
        } else if (loading) {
          return <button className={styles.button}>Loading...</button>;
        } else {
          return (
            <button onClick={addAddressToWhitelist} className={styles.button}>
              Join the Whitelist
            </button>
          );
        }
      } else {
        return (
          <button onClick={connectWallet} className={styles.button}>
            Connect your wallet
          </button>
        );
      }
    };
 // useEffects are used to react to changes in state of the website
  // The array at the end of function call represents what state changes will trigger this effect
  // In this case, whenever the value of `walletConnected` changes - this effect will be called
  useEffect(() => {
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if (!walletConnected) {
      // Assign the Web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
    }
  }, [walletConnected]);

  return (
    <div>
      <Head>
        <title>Whitelist Dapp</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
          <div className={styles.description}>
            Its an NFT collection for developers in Crypto.
          </div>
          <div className={styles.description}>
            {numberOfWhitelisted} have already joined the Whitelist
          </div>
          {renderButton()}
        </div>
        <div>
          <Image 
           height={100}
           width={100}
           alt='crypto-dev'
           className={styles.image} 
           src="./crypto-devs.svg" 
           />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
}
