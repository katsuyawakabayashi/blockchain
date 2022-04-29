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
  const [inputSymbol, setInputSymbol] = useState<string>()
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
  const getPricePerUSD = async (symbol: string) => {
    const res = await axios.get('https://api.coinbase.com/v2/exchange-rates')
    const rates = res.data.data.rates
    const pricePerUSD = await rates[symbol]
    return pricePerUSD
  }
  const displayContract = async () => {
    setLoading(true)
    setError(false)
    const provider = await getProvider()
    let contractInfo = []
    setContracts(['', '', ''])
    if (!inputAddress) {
      setLoading(false)
      setError(true)
      setMessage('Error with the address')
    }
    if (inputSymbol) {
      const token = await getTokenInfo(inputSymbol)
      try {
        const contract = await new ethers.Contract(
          token!.address,
          ABI,
          provider
        )
        const tokenBalance = await contract.balanceOf(inputAddress)
        const formattedTokenBalance = ethers.utils.formatUnits(tokenBalance, 18)
        const tokenPerUSD = await getPricePerUSD(inputSymbol!)
        const tokenInUSD = Number(formattedTokenBalance) / Number(tokenPerUSD)

        contractInfo.push(formattedTokenBalance)
        contractInfo.push(tokenInUSD.toLocaleString())
        setContracts(contractInfo)
      } catch (error) {
        setMessage(String(error))
      }
    } else {
      try {
        const ETHBalance = await provider?.getBalance(inputAddress)
        const ETHperUSD = await getPricePerUSD('ETH')
        const formattedEtherBlance = ethers.utils.formatEther(ETHBalance!)
        const ETHinUSD = Number(formattedEtherBlance) / Number(ETHperUSD)
        contractInfo.push(formattedEtherBlance)
        contractInfo.push(ETHinUSD.toLocaleString())
        setContracts(contractInfo)
      } catch (error) {
        setMessage(String(error))
      }
    }
    setLoading(false)
  }

  const handleSubmit = async (event: any) => {
    event.preventDefault()
    await displayContract()
  }

  return (
    <div className="relative flex h-screen  flex-col items-center gap-10 bg-gray-900 p-10 text-white">
      <span className="absolute right-5 bottom-5 rounded-xl bg-blue-700 p-2 shadow-xl hover:bg-blue-800">
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
        >
          <option value="">ETH</option>
          <option value="DAI">DAI</option>
          <option value="ZRX">ZRX</option>
          <option value="USDT">USDT</option>
          <option value="BAT">BAT</option>
        </select>
        {loading ? (
          <div>Searching...</div>
        ) : (
          <div>
            {inputSymbol ? (
              <div>
                {' '}
                <p>
                  {inputSymbol} Balance: {contracts![0]}
                </p>
                <p>In USD $: {contracts![1]}</p>
              </div>
            ) : (
              <div>
                <p>Ether Balance: {contracts![0]}</p>
                <p>In USD $: {contracts![1]}</p>
              </div>
            )}
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
