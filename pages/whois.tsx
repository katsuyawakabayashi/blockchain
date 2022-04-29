import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { getTokenInfo } from 'erc20-token-list'
import { ethers } from 'ethers'

const ABI = [
  // Some details about the token
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  // Get the account balance
  'function balanceOf(address) view returns (uint)',
  // Send some of your tokens to someone else
  'function transfer(address to, uint amount)',
  // An event triggered whenever anyone transfers to someone else
  'event Transfer(address indexed from, address indexed to, uint amount)',
]

const Whois = () => {
  const [wallets, setWallets] = useState()
  const [contracts, setContracts] = useState<string[]>(['', '', ''])
  const [inputAddress, setInputAddress] = useState<string>('')
  const [inputSymbol, setInputSymbol] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<boolean>(false)
  const [message, setMessage] = useState<string>('Error 1')
  const isMetamaskConnected = async () => {
    const provider = await getProvider()
    const accounts = await provider?.listAccounts()
    if (accounts) {
      return accounts.length > 0
    }
  }
  useEffect(() => {
    const reconnectMetamask = async () => {
      const connected = await isMetamaskConnected()
      if (connected) {
        connectWalletHandler()
      }
    }
    reconnectMetamask()
  }, [])

  const connectWalletHandler = async () => {
    const provider = await getProvider()
    if (provider) {
      const wallet = await provider.send('eth_requestAccounts', [])
      setWallets(wallet)
    }
  }

  const getProvider = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        return provider
      } catch (error) {
        alert(error)
      }
    }
  }
  const getETHPerUSD = async () => {
    const res = await axios.get('https://api.coinbase.com/v2/exchange-rates')
    return res.data.data.rates.ETH
  }
  const displayContract = async () => {
    const token = await getTokenInfo(inputSymbol)
    setLoading(true)
    setError(false)

    if (token && inputAddress) {
      const provider = await getProvider()
      try {
        const contract = await new ethers.Contract(token.address, ABI, provider)
        const contractInfo = []
        const contractName = await contract.name()
        const contractSymbol = await contract.symbol()
        const contractBalance = await contract.balanceOf(inputAddress)
        const formattedContractBalance = ethers.utils.formatUnits(
          contractBalance,
          18
        )

        const balance = await provider?.getBalance(inputAddress)
        const ETHperUSD = await getETHPerUSD()
        const formattedEtherBlance = ethers.utils.formatEther(balance!)
        const ETHinUSD = Number(formattedEtherBlance) / Number(ETHperUSD)

        contractInfo.push(contractName)
        contractInfo.push(contractSymbol)
        contractInfo.push(formattedContractBalance)
        contractInfo.push(formattedEtherBlance)
        contractInfo.push(ETHinUSD.toLocaleString())
        setContracts(contractInfo)
      } catch (error) {
        setMessage(String(error))
      }
      setLoading(false)
      setError(false)
    } else {
      setError(true)
      setMessage('Invalid value')
      setLoading(false)
    }
  }

  const handleSubmit = async (event: any) => {
    event.preventDefault()
    await displayContract()
  }

  return (
    <div className="relative flex h-screen  flex-col items-center gap-10 bg-gray-900 p-10 text-white">
      <span className="absolute right-5 top-5 rounded-xl bg-blue-700 p-2 shadow-xl hover:bg-blue-800">
        {wallets ? (
          <div>
            <p className="w-48 truncate">Connected: {wallets}</p>
          </div>
        ) : (
          <button onClick={connectWalletHandler}>Connect wallet</button>
        )}
      </span>
      <div>ENS Whois</div>
      {error && <div className="rounded-xl bg-red-500 p-5">{message}</div>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <label>
          <input
            onChange={(e) => setInputAddress(e.target.value)}
            className="text-black"
            value={inputAddress}
          />
        </label>
        <select
          className="text-black"
          onChange={(e) => setInputSymbol(e.target.value)}
          value="DAI"
        >
          <option value="DAI">DAI</option>
          <option value="ZRX">ZRX</option>
          <option value="USDT">USDT</option>
          <option value="BAT">BAT</option>
        </select>
        {loading ? (
          <div>Searching...</div>
        ) : (
          <div>
            <p>Token: {contracts![0]}</p>
            <p>Balance: {contracts![2]}</p>
            <p>Ether Balance: {contracts![3]}</p>
            <p>USD Conversion $: {contracts![4]}</p>
          </div>
        )}

        <button
          type="submit"
          className="h-12 w-24 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        >
          Search
        </button>
      </form>
    </div>
  )
}

export default Whois
