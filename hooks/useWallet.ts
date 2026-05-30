import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'sonner';

declare global {
  interface Window {
    ethereum?: {
      isMetaMask: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (params: any) => void) => void;
      removeListener: (event: string, callback: (params: any) => void) => void;
      networkVersion: string;
    };
  }
}

interface NetworkInfo {
  chainId: string;
  name: string;
}

export const useWallet = () => {
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [network, setNetwork] = useState<NetworkInfo | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const saveWalletToDatabase = async (address: string, signature: string, message: string) => {
    try {
      await fetch('/api/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address, signature, message }),
      });
    } catch (err) {
      console.error('Failed to save wallet to database:', err);
    }
  };

  const getNetworkInfo = async (chainId: string): Promise<NetworkInfo> => {
    const networks: { [key: string]: string } = {
      '1': 'Ethereum Mainnet',
      '5': 'Goerli Testnet',
      '11155111': 'Sepolia Testnet',
      '137': 'Polygon Mainnet',
      '80001': 'Mumbai Testnet',
    };
    return {
      chainId,
      name: networks[chainId] || `Chain ID: ${chainId}`,
    };
  };

  const updateBalance = async (address: string) => {
    if (!window.ethereum) return;
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const balance = await provider.getBalance(address);
      const ethBalance = ethers.utils.formatEther(balance);
      setBalance(parseFloat(ethBalance).toFixed(4));
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };

  const updateNetwork = async () => {
    if (!window.ethereum) return;
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum as any, 'any');
      const network = await provider.getNetwork();
      const networkInfo = await getNetworkInfo(network.chainId.toString());
      setNetwork(networkInfo);
    } catch (err) {
      console.error('Error fetching network:', err);
    }
  };

  useEffect(() => {
    // Check if MetaMask is installed
    setIsMetaMaskInstalled(!!window.ethereum?.isMetaMask);

    // Check if already connected
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum as any, 'any');
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            updateBalance(accounts[0]);
            updateNetwork();
            // Note: We don't save to database on auto-reconnect because it requires signing a message
          }
        } catch (err) {
          console.error('Error checking connection:', err);
        }
      }
    };

    checkConnection();

    // Listen for account changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setAccount(null);
        setBalance('0');
        setNetwork(null);
      } else {
        setAccount(accounts[0]);
        updateBalance(accounts[0]);
      }
    };

    const handleChainChanged = () => {
      if (account) {
        updateBalance(account);
        updateNetwork();
      }
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [account]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error('MetaMask is not installed. Please install it to connect your wallet.');
      setError('MetaMask is not installed');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum as any, 'any');
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      
      const message = `Sign this message to authenticate your wallet connection to TheTaskope.\n\nAddress: ${address}\nNonce: ${Date.now()}`;
      const signature = await signer.signMessage(message);
      
      setAccount(address);
      updateBalance(address);
      updateNetwork();
      saveWalletToDatabase(address, signature, message);
      setIsOpen(true);
    } catch (err: any) {
      setError('Failed to connect or authenticate wallet');
      toast.error('Failed to connect or authenticate wallet: ' + (err?.message || 'Unknown error'));
      console.error('Error connecting wallet:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setBalance('0');
    setNetwork(null);
    setIsOpen(false);
  };

  const toggleWalletMenu = () => {
    setIsOpen(!isOpen);
  };

  return {
    isMetaMaskInstalled,
    account,
    isConnecting,
    error,
    balance,
    network,
    isOpen,
    connectWallet,
    disconnectWallet,
    toggleWalletMenu,
  };
}; 