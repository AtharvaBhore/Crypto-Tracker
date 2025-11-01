"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import Link from "next/link"

interface CryptoData {
  id: string
  name: string
  symbol: string
  price: number
  logo: string
  change24h?: number
}

const cryptoList: Omit<CryptoData, "price">[] = [
  { id: "bitcoin", name: "Bitcoin", symbol: "BTC", logo: "/bitcoin-logo.png" },
  { id: "ethereum", name: "Ethereum", symbol: "ETH", logo: "/ethereum-logo.png" },
  { id: "cardano", name: "Cardano", symbol: "ADA", logo: "/cardano-logo.jpg" },
  { id: "solana", name: "Solana", symbol: "SOL", logo: "/solana-logo.png" },
  { id: "polkadot", name: "Polkadot", symbol: "DOT", logo: "/polkadot-logo.png" },
  { id: "ripple", name: "Ripple", symbol: "XRP", logo: "/ripple-xrp-logo.jpg" },
  { id: "binancecoin", name: "Binance Coin", symbol: "BNB", logo: "/binance-coin-logo.jpg" },
  { id: "dogecoin", name: "Dogecoin", symbol: "DOGE", logo: "/dogecoin-logo.png" },
  { id: "litecoin", name: "Litecoin", symbol: "LTC", logo: "/litecoin-logo.png" },
  { id: "tron", name: "Tron", symbol: "TRX", logo: "/tron-trx-logo.jpg" },
]

export default function CryptoPriceTracker() {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoData | null>(null)
  const [mode, setMode] = useState<"buy" | "sell" | null>(null)
  const [quantity, setQuantity] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [plMessage, setPlMessage] = useState<string | null>(null)
  const [showPlDialog, setShowPlDialog] = useState(false)

  const fetchPrices = async () => {
    setLoading(true)
    try {
      const ids = cryptoList.map((crypto) => crypto.id).join(",")
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
      )
      const data = await res.json()
      const updated = cryptoList.map((c) => ({
        ...c,
        price: data[c.id]?.usd || 0,
        change24h: data[c.id]?.usd_24h_change || 0,
      }))
      setCryptoData(updated)
    } catch {
      setError("Failed to fetch prices")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrices()
  }, [])

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: price < 1 ? 6 : 2,
    }).format(price)

  const saveTransaction = async (id: string, type: "buy" | "sell", quantity: number, price: number) => {
    const transaction = { type, quantity, price, timestamp: Date.now() }

    try {
      await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cryptoId: id, transaction }),
      })
    } catch (err) {
      console.error("Error saving transaction:", err)
    }
  }


  const handleConfirm = () => {
    if (!selectedCrypto || !mode) return
    const qty = parseFloat(quantity)
    if (isNaN(qty) || qty <= 0) return alert("Enter a valid quantity")

    const id = selectedCrypto.id
    const price = selectedCrypto.price

    const portfolio = JSON.parse(localStorage.getItem("portfolio") || "{}")
    const transactions = portfolio[id] || []

    // Total coins owned
    const owned = transactions.reduce((sum: number, t: any) => {
      return t.type === "buy" ? sum + t.quantity : sum - t.quantity
    }, 0)

    if (mode === "sell" && qty > owned) {
      alert(`You only have ${owned} ${selectedCrypto.symbol}. You cannot sell ${qty}.`)
      return
    }

    // Save transaction
    if (!portfolio[id]) portfolio[id] = []
    portfolio[id].push({ type: mode, quantity: qty, price, timestamp: Date.now() })
    saveTransaction(id, mode, qty, price)

    // If selling, calculate profit/loss
    if (mode === "sell") {
      const buyTransactions = transactions.filter((t: any) => t.type === "buy")
      const totalBought = buyTransactions.reduce((sum: number, t: any) => sum + t.quantity, 0)
      const totalSpent = buyTransactions.reduce((sum: number, t: any) => sum + t.quantity * t.price, 0)
      const avgPrice = totalBought ? totalSpent / totalBought : 0
      const profitLoss = (price - avgPrice) * qty
      setPlMessage(`${profitLoss >= 0 ? "Profit" : "Loss"}: ${formatPrice(profitLoss)}`)
      setShowPlDialog(true)
    }

    // Reset dialog
    setSelectedCrypto(null)
    setMode(null)
    setQuantity("")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass border-b border-border/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Crypto Price Tracker
            </h1>
            <Link href="/portfolio" className="text-sm underline text-muted-foreground">
              View Portfolio →
            </Link>
          </div>
          <Button onClick={fetchPrices} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {cryptoData.map((c) => {
            const positive = (c.change24h || 0) >= 0
            return (
              <Card key={c.id} className="p-6 flex flex-col items-center text-center space-y-3">
                <img src={c.logo} alt={c.name} className="w-10 h-10 rounded-full" />
                <p className="font-bold">{c.name}</p>
                <p className="text-sm text-muted-foreground">{c.symbol}</p>
                <p className="text-lg font-semibold">{formatPrice(c.price)}</p>
                <div className={`text-sm ${positive ? "text-green-500" : "text-red-500"}`}>
                  {positive ? <TrendingUp className="inline w-3 h-3 mr-1" /> : <TrendingDown className="inline w-3 h-3 mr-1" />}
                  {c.change24h?.toFixed(2)}%
                </div>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={() => { setSelectedCrypto(c); setMode("buy") }}>Buy</Button>
                  <Button size="sm" variant="outline" onClick={() => { setSelectedCrypto(c); setMode("sell") }}>Sell</Button>
                </div>
              </Card>
            )
          })}
        </div>
      </main>

      <Dialog open={!!selectedCrypto} onOpenChange={() => setSelectedCrypto(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{mode === "buy" ? "Buy" : "Sell"} {selectedCrypto?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p>Current Price: {selectedCrypto && formatPrice(selectedCrypto.price)}</p>
            <div className="relative w-full">
              <input
                type="number"
                placeholder="Qty"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full pr-8 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none border border-gray-300 rounded-md p-2"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col justify-center">
                <button
                  type="button"
                  onClick={() => setQuantity(prev => String(Number(prev) + 1))}
                  className="secondary hover:text-blue-700 leading-none"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => setQuantity(prev => String(Math.max(Number(prev) - 1, 0)))}
                  className="secondary hover:text-blue-700 leading-none"
                >
                  ▼
                </button>
              </div>
            </div>

            <Button onClick={handleConfirm}>
              Confirm {mode?.toUpperCase()}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showPlDialog} onOpenChange={() => setShowPlDialog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transaction Result</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-lg font-semibold">{plMessage}</p>
            <Button className="mt-4" onClick={() => setShowPlDialog(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
