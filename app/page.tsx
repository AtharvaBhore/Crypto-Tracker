"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react"

interface CryptoData {
  id: string
  name: string
  symbol: string
  price: number
  logo: string
}

const cryptoList: Omit<CryptoData, "price">[] = [
  { id: "bitcoin", name: "Bitcoin", symbol: "BTC", logo: "https://crytp-store.s3.ap-south-1.amazonaws.com/bitcoin-logo.png" },
  { id: "ethereum", name: "Ethereum", symbol: "ETH", logo: "https://crytp-store.s3.ap-south-1.amazonaws.com/ethereum-logo.png" },
  { id: "cardano", name: "Cardano", symbol: "ADA", logo: "https://crytp-store.s3.ap-south-1.amazonaws.com/cardano-logo.jpg" },
  { id: "solana", name: "Solana", symbol: "SOL", logo: "https://crytp-store.s3.ap-south-1.amazonaws.com/solana-logo.png" },
  { id: "polkadot", name: "Polkadot", symbol: "DOT", logo: "https://crytp-store.s3.ap-south-1.amazonaws.com/polkadot-logo.png" },
  { id: "ripple", name: "Ripple", symbol: "XRP", logo: "https://crytp-store.s3.ap-south-1.amazonaws.com/ripple-xrp-logo.jpg" },
  { id: "binancecoin", name: "Binance Coin", symbol: "BNB", logo: "https://crytp-store.s3.ap-south-1.amazonaws.com/binance-coin-logo.jpg" },
  { id: "dogecoin", name: "Dogecoin", symbol: "DOGE", logo: "https://crytp-store.s3.ap-south-1.amazonaws.com/dogecoin-logo.png" },
  { id: "litecoin", name: "Litecoin", symbol: "LTC", logo: "https://crytp-store.s3.ap-south-1.amazonaws.com/litecoin-logo.png" },
  { id: "tron", name: "Tron", symbol: "TRX", logo: "https://crytp-store.s3.ap-south-1.amazonaws.com/tron-trx-logo.jpg" },
]

export default function CryptoPriceTracker() {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchPrices = async () => {
    setLoading(true)
    setError(null)

    try {
      const ids = cryptoList.map((crypto) => crypto.id).join(",")
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
      )

      if (!response.ok) {
        throw new Error("Failed to fetch crypto prices")
      }

      const data = await response.json()

      const updatedCryptoData = cryptoList.map((crypto) => ({
        ...crypto,
        price: data[crypto.id]?.usd || 0,
        change24h: data[crypto.id]?.usd_24h_change || 0,
      }))

      setCryptoData(updatedCryptoData)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrices()
  }, [])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: price < 1 ? 6 : 2,
    }).format(price)
  }

  const formatChange = (change: number) => {
    return `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Crypto Price Tracker
              </h1>
              {lastUpdated && (
                <p className="text-sm text-muted-foreground mt-1">Last updated: {lastUpdated.toLocaleTimeString()}</p>
              )}
            </div>
            <Button
              onClick={fetchPrices}
              disabled={loading}
              className="glass-hover bg-primary/20 hover:bg-primary/30 border border-primary/30"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="glass border border-destructive/30 bg-destructive/10 text-destructive-foreground p-4 rounded-xl mb-6">
            <p className="font-medium">Error: {error}</p>
            <Button
              onClick={fetchPrices}
              variant="outline"
              size="sm"
              className="mt-2 border-destructive/30 hover:bg-destructive/20 bg-transparent"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Crypto Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {cryptoList.map((crypto, index) => {
            const data = cryptoData.find((d) => d.id === crypto.id)
            const change24h = (data as any)?.change24h || 0
            const isPositive = change24h >= 0

            return (
              <Card
                key={crypto.id}
                className={`glass glass-hover border-border/30 p-6 transition-all duration-300 ${
                  loading ? "animate-pulse" : ""
                }`}
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <div className="flex flex-col items-center space-y-4">
                  {/* Logo */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-primary/30">
                    <img
                      src={crypto.logo || "/placeholder.svg"}
                      alt={`${crypto.name} logo`}
                      className="w-8 h-8 rounded-full"
                    />
                  </div>

                  {/* Name & Symbol */}
                  <div className="text-center">
                    <h3 className="font-bold text-foreground text-sm">{crypto.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono">{crypto.symbol}</p>
                  </div>

                  {/* Price */}
                  <div className="text-center">
                    {loading ? (
                      <div className="h-6 w-20 bg-muted/30 rounded animate-pulse" />
                    ) : (
                      <p className="text-lg font-bold text-foreground">{data ? formatPrice(data.price) : "$0.00"}</p>
                    )}

                    {/* 24h Change */}
                    {!loading && data && (
                      <div
                        className={`flex items-center justify-center mt-1 text-xs ${
                          isPositive ? "text-chart-5" : "text-destructive"
                        }`}
                      >
                        {isPositive ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        )}
                        {formatChange(change24h)}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Loading State */}
        {loading && cryptoData.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="glass p-8 rounded-xl">
              <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground text-center">Loading crypto prices...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
