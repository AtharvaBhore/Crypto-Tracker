"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState<any>({})
  const [prices, setPrices] = useState<any>({})

  useEffect(() => {
    const data = fetch("/api/portfolio")
      .then((res) => res.json())
      .then((data) => {
        // Convert the array from DynamoDB into an object
        const mapped = data.reduce((acc: any, item: any) => {
          acc[item.cryptoId] = item.transactions
          return acc
        }, {})

        setPortfolio(mapped)

        const ids = Object.keys(mapped).join(",")
        if (ids) {
          fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`)
            .then((res) => res.json())
            .then(setPrices)
        }
      })


    const ids = Object.keys(data).join(",")
    if (ids) {
      fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`)
        .then((res) => res.json())
        .then(setPrices)
    }
  }, [])

  const calculateStats = (id: string) => {
    const raw = portfolio[id];
    const transactions = Array.isArray(raw) ? raw : []
    let qty = 0
    let cost = 0
    const buys: { quantity: number; price: number }[] = []

    transactions.forEach((t: any) => {
      if (t.type === "buy") {
        qty += t.quantity
        cost += t.quantity * t.price
        buys.push({ quantity: t.quantity, price: t.price })
      } else if (t.type === "sell") {
        let remainingToSell = t.quantity
        while (remainingToSell > 0 && buys.length > 0) {
          const b = buys[0]
          if (b.quantity <= remainingToSell) {
            // Remove full buy
            remainingToSell -= b.quantity
            cost -= b.quantity * b.price
            qty -= b.quantity
            buys.shift()
          } else {
            // Partially reduce buy
            b.quantity -= remainingToSell
            cost -= remainingToSell * b.price
            qty -= remainingToSell
            remainingToSell = 0
          }
        }
      }
    })

    const avg = qty > 0 ? cost / qty : 0
    const currentPrice = prices[id]?.usd || 0
    const totalValue = qty * currentPrice
    const pnl = qty > 0 ? ((currentPrice - avg) / avg) * 100 : 0

    return { qty, avg, currentPrice, totalValue, pnl, cost }
  }

  // Calculate net profit/loss for entire portfolio
  const netStats = () => {
    let totalCost = 0
    let totalValue = 0

    Object.keys(portfolio).forEach((id) => {
      const { qty, cost, currentPrice } = calculateStats(id)
      if (qty > 0) {
        totalCost += cost
        totalValue += qty * currentPrice
      }
    })

    const netPL = totalValue - totalCost
    const netPLPercent = totalCost > 0 ? (netPL / totalCost) * 100 : 0
    return { netPL, netPLPercent }
  }

  const { netPL, netPLPercent } = netStats()

  return (
    <div className="min-h-screen bg-background container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Portfolio</h1>
        <Link href="/"><Button variant="outline">← Back to Tracker</Button></Link>
      </div>

      {/* Net Profit/Loss */}
      {Object.keys(portfolio).length > 0 && (
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold">Net Profit/Loss</h2>
          <p className={`text-lg ${netPL >= 0 ? "text-green-500" : "text-red-500"}`}>
            ${netPL.toFixed(2)} ({netPLPercent.toFixed(2)}%)
          </p>
        </Card>
      )}

      {Object.keys(portfolio).length === 0 ? (
        <p className="text-muted-foreground">No transactions yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.keys(portfolio).map((id) => {
            const { qty, avg, currentPrice, totalValue, pnl } = calculateStats(id)
            if (qty <= 0) return null
            return (
              <Card key={id} className="p-6 space-y-2">
                <h3 className="font-bold capitalize">{id}</h3>
                <p>Quantity: {qty.toFixed(4)}</p>
                <p>Avg Buy: ${avg.toFixed(2)}</p>
                <p>Current Price: ${currentPrice.toFixed(2)}</p>
                <p>Total Value: ${totalValue.toFixed(2)}</p>
                <p className={`${pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                  P/L: {pnl.toFixed(2)}%
                </p>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
