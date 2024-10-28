import { AmountPreference, CashuMint, CashuWallet, Proof, Token, TokenEntry } from "@cashu/cashu-ts";

export default class LocalWallet {
  private mint?: CashuMint;
  private wallet?: CashuWallet;
  private proofs: Proof[] = [];
  private readonly storageKey: string;

  get unit() {
    return this.wallet?.unit;
  }
  get mintUrl() {
    return this.mint?.mintUrl;
  }

  constructor(storageKey = "cashu-wallet") {
    this.storageKey = storageKey;
    this.load();
  }

  private lock?: Promise<any>;
  private async runInLock<T extends unknown>(run: () => Promise<T>): Promise<T> {
    let p: Promise<T>;
    if (this.lock) {
      p = this.lock.then(() => run());
      this.lock = p;
    } else {
      p = this.lock = run();
    }

    return p;
  }

  async load() {
    try {
      const storedProofs = localStorage.getItem(this.storageKey);
      if (storedProofs) {
        const token: TokenEntry = JSON.parse(storedProofs);
        this.mint = new CashuMint(token.mint);
        this.wallet = new CashuWallet(this.mint);
        this.proofs = token.proofs;
      }
    } catch (error) {
      console.error("Error loading proofs from localStorage:", error);
    }
  }

  async save() {
    if (!this.mint) throw new Error("Wallet not setup");
    try {
      const token: TokenEntry = {
        proofs: this.proofs,
        mint: this.mint.mintUrl,
      };
      localStorage.setItem(this.storageKey, JSON.stringify(token));
    } catch (error) {
      console.error("Error saving proofs to localStorage:", error);
    }
  }

  public getBalance() {
    return this.proofs.reduce((t, p) => t + p.amount, 0);
  }

  public async send(amount: number, opts?: Parameters<CashuWallet["send"]>[2]) {
    if (!this.mint || !this.wallet) throw new Error("Wallet not setup");

    return await this.runInLock(async () => {
      // attempt to collect enough tokens to pay
      const proofs = Array.from(this.proofs).sort((a, b) => b.amount - a.amount);

      let hand: Proof[] = [];
      let remaining = amount;
      for (const proof of proofs) {
        if (proof.amount >= remaining) {
          hand.push(proof);
          remaining -= proof.amount;
        }
        if (remaining === 0) break;
      }

      // if successful remove proofs from wallet
      if (remaining === 0) {
        for (const proof of hand) {
          this.proofs.splice(this.proofs.indexOf(proof), 1);
        }
        await this.save();
        return { token: [{ proofs: hand, mint: this.mint!.mintUrl }] } satisfies Token;
      } else {
        // didn't have enough coins to pay exact change
        const { send, returnChange } = await this.wallet!.send(amount, this.proofs, opts);
        this.proofs = returnChange;
        await this.save();

        return {
          token: [
            {
              proofs: send,
              mint: this.mint!.mintUrl,
            },
          ],
        } satisfies Token;
      }
    });
  }

  public async optimize(amounts: AmountPreference[]) {
    return this.runInLock(async () => {
      if (!this.mint || !this.wallet) throw new Error("Wallet not setup");

      const { send, returnChange } = await this.wallet.send(this.getBalance(), this.proofs, { preference: amounts });
      this.proofs = [...send, ...returnChange];
      await this.save();
    });
  }

  public async receive(token: Token, opts?: Parameters<CashuWallet["receiveTokenEntry"]>[1]) {
    for (const entry of token.token) {
      if (!this.mint || !this.wallet) {
        this.mint = new CashuMint(entry.mint);
        this.wallet = new CashuWallet(this.mint);
      } else if (entry.mint !== this.mint.mintUrl) {
        throw new Error("Cant receive tokens from another mint");
      }

      try {
        const received = await this.wallet.receiveTokenEntry(entry, opts);
        this.proofs = [...this.proofs, ...received];
        await this.save();
        return this.getBalance();
      } catch (error) {
        console.error("Error receiving token:", error);
      }
    }
  }

  public withdrawAll() {
    if (!this.mint || !this.wallet) throw new Error("Wallet not setup");
    const token: TokenEntry = {
      proofs: this.proofs,
      mint: this.mint.mintUrl,
    };
    return token;
  }

  public async clear() {
    this.proofs = [];
    localStorage.removeItem(this.storageKey);
  }
}
