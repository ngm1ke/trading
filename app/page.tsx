import { Chart } from "@/components/Chart";
import Header from "@/components/Header";

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-950 text-slate-100 font-sans antialiased selection:bg-emerald-500/30">
      <Header />

      <main className="flex-1 p-4 lg:p-6 grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 flex flex-col space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Chart />
            </div>
            <div className="lg:col-span-1">OrderBook</div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">Open Order</div>
            <div className="lg:col-span-1">Portfolio</div>
          </div>
        </div>

        <div className="xl:col-span-1 flex flex-col space-y-6">
          form, history
        </div>
      </main>
    </div>
  );
}
