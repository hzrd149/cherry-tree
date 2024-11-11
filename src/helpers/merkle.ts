import { decodeCBOR, encodeCBOR } from "@cashu/cashu-ts/dist/lib/es6/cbor";
import { sha256 } from "@noble/hashes/sha256";

export interface MerkleNode {
  hash: Uint8Array;
  left?: MerkleNode;
  right?: MerkleNode;
}

function merge(a: Uint8Array, b: Uint8Array) {
  var merged = new Uint8Array(a.length + b.length);
  merged.set(a);
  merged.set(b, a.length);
  return merged;
}

type TreeArray = [Uint8Array] | [Uint8Array, TreeArray] | [Uint8Array, TreeArray, TreeArray];
export function encodeTree(tree: MerkleNode) {
  const toArray = (branch: MerkleNode): TreeArray => {
    if (branch.left && branch.right) return [branch.hash, toArray(branch.left), toArray(branch.right)];
    else if (branch.left) return [branch.hash, toArray(branch.left)];
    else return [branch.hash];
  };

  return encodeCBOR(toArray(tree));
}
export function decodeTree(cbor: Uint8Array) {
  const decoded = decodeCBOR(cbor) as TreeArray;
  if (!Array.isArray(decoded)) throw new Error("Invalid tree");

  const fromArray = (branch: TreeArray): MerkleNode => {
    return {
      hash: branch[0],
      left: branch[1] ? fromArray(branch[1]) : undefined,
      right: branch[2] ? fromArray(branch[2]) : undefined,
    };
  };

  return fromArray(decoded);
}

export function getLeafNodes(tree: MerkleNode) {
  const nodes: MerkleNode[] = [];

  const walk = (branch: MerkleNode) => {
    if (!branch.left && !branch.right) nodes.push(branch);
    else {
      if (branch.left) walk(branch.left);
      if (branch.right) walk(branch.right);
    }
  };

  walk(tree);

  return nodes;
}

export function buildMerkleTree(nodes: MerkleNode[]): MerkleNode {
  if (nodes.length === 1) return nodes[0];

  const parents: MerkleNode[] = [];

  for (let i = 0; i < nodes.length; i += 2) {
    const left = nodes[i];
    const right = i + 1 < nodes.length ? nodes[i + 1] : nodes[i];

    const parent: MerkleNode = {
      hash: sha256(merge(left.hash, right.hash)),
      left,
      right: i + 1 < nodes.length ? right : undefined,
    };

    parents.push(parent);
  }

  return buildMerkleTree(parents);
}
