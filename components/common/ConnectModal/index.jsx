import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useAccount, useConnect } from "wagmi";
import lscache from "lscache";

import { useWallet } from "@solana/wallet-adapter-react";

import Modal from "@/components/common/Modal";

import { useAuth } from "@/logic/wagmi/hooks/useAuth";
import { useAuth as useAuthSol } from "@/logic/solwalletadapter/hooks/useAuth";

import { PROJECT_CONNECTED_WALLET } from "@/logic/constants/user";
import { walletsIds, walletIcons } from "@/logic/wagmi/wallets";
import {
  walletsIds as solWalletsIds,
  walletIcons as solWalletIcons,
} from "@/logic/solwalletadapter/wallets";

import {
  setConnectedWallet,
  setVisibleConnectModal,
} from "@/store/reducers/user";

import styles from "./style.module.scss";

const sortOrder = (array, order, key) => {
  array.sort(function (a, b) {
    const A = a[key],
      B = b[key];

    if (order.indexOf(A) > order.indexOf(B)) {
      return 1;
    } else {
      return -1;
    }
  });

  return array;
};

const sortOrderSol = (array, order, key) => {
  const parsedKey = key.split(".");
  const orderMap = new Map(
    order.map((name, index) => [name.toLowerCase(), index])
  );

  return array.sort((a, b) => {
    const nameA = a[parsedKey[0]][parsedKey[1]]?.toLowerCase().trim() || "";
    const nameB = b[parsedKey[0]][parsedKey[1]]?.toLowerCase().trim() || "";
    const indexA = orderMap.get(nameA) ?? Infinity;
    const indexB = orderMap.get(nameB) ?? Infinity;
    return indexA - indexB;
  });
};

export default function ConnectModal({ visible = false }) {
  const { login } = useAuth();
  const { login: loginSol, checkConnected } = useAuthSol();

  const dispatch = useDispatch();

  const { connectors } = useConnect();
  const { address } = useAccount();
  const { wallets, publicKey, disconnect, connecting } = useWallet();

  const [connectorsList, setConnectorsList] = useState([]);
  const [connectorsSolList, setConnectorsSolList] = useState([]);

  useEffect(() => {
    const disconnected = window.localStorage.getItem("walletDisconnected");

    if (!disconnected) {
      const connector = window.localStorage.getItem("walletConnector");
      const walletConnectorProvider = window.localStorage.getItem(
        "walletConnectorProvider"
      );
      if (solWalletsIds.includes(walletConnectorProvider)) {
        const connectedWallet = lscache.get(PROJECT_CONNECTED_WALLET);
        if (connectedWallet?.isConnected) {
          dispatch(
            setConnectedWallet({
              address: connectedWallet.address,
              agentAddress: connectedWallet?.agentAddress || "",
              isConnected: true,
              provider: connectedWallet.provider,
              chain: connectedWallet?.chain,
              token: connectedWallet?.token,
            })
          );
        }
      } else {
        if (connector && address) {
          const connectedWallet = lscache.get(PROJECT_CONNECTED_WALLET);
          if (
            connectedWallet?.isConnected &&
            address.toLowerCase() === connectedWallet.address.toLowerCase()
          ) {
            dispatch(
              setConnectedWallet({
                address: connectedWallet.address,
                agentAddress: connectedWallet?.agentAddress || "",
                isConnected: true,
                provider: connectedWallet.provider,
                token: connectedWallet?.token,
              })
            );
          }
        }
      }
    }
  }, []);

  useEffect(() => {
    setConnectorsList([]);
    if (connectors?.length > 0) {
      const array = connectors.filter((connector) =>
        walletsIds.includes(connector.id)
      );

      const newList = sortOrder(array, walletsIds, "id");
      setConnectorsList(newList);
    }
  }, [connectors]);

  useEffect(() => {
    setConnectorsSolList([]);
    if (wallets?.length > 0) {
      const array = wallets.filter((wallet) =>
        solWalletsIds.includes(wallet.adapter.name.toLowerCase().trim())
      );

      const newList = sortOrderSol(array, solWalletsIds, "adapter.name");
      setConnectorsSolList(newList);
    }
  }, [wallets]);

  useEffect(() => {
    if (publicKey) {
      const connectedWallet = lscache.get(PROJECT_CONNECTED_WALLET);
      checkConnected(connectedWallet).then((r) => {});
    }
  }, [publicKey]);

  return (
    <Modal
      isVisible={visible}
      onClose={() => dispatch(setVisibleConnectModal(false))}
      title="Connect Wallet"
    >
      {/*<div className={styles.chainToggle}>*/}
      {/*  <input*/}
      {/*    type="checkbox"*/}
      {/*    id="checkbox-net-toggle"*/}
      {/*    defaultChecked={filterChain !== "evm"}*/}
      {/*    onChange={(e) => {*/}
      {/*      if (e.target.checked) {*/}
      {/*        setFilterChain("solana");*/}
      {/*      } else {*/}
      {/*        setFilterChain("evm");*/}
      {/*      }*/}
      {/*    }}*/}
      {/*  />*/}
      {/*  <span>EVM</span>*/}
      {/*  <label htmlFor="checkbox-net-toggle" />*/}
      {/*  <span>SOL</span>*/}
      {/*</div>*/}
      <ul className={styles.connectorsList}>
        {/*{filterChain === "evm" &&*/}
        {connectorsList.map((connector) => (
          <li key={connector.uid}>
            <button
              type="button"
              onClick={async () => {
                window.localStorage.setItem("walletConnector", connector.id);
                window.localStorage.setItem(
                  "walletConnectorName",
                  connector.name
                );
                window.localStorage.setItem(
                  "walletConnectorProvider",
                  connector.id
                );
                window.localStorage.removeItem("walletDisconnected");
                dispatch(setVisibleConnectModal(false));

                await login({ connector });
              }}
            >
              <img
                src={walletIcons[connector.id] || connector.icon}
                alt=""
                width={32}
                height={32}
                loading="lazy"
                decoding="async"
              />
              {connector.name}
            </button>
          </li>
        ))}
        {/*{filterChain === "solana" &&*/}
        {connectorsSolList.map((connector) => (
          <li key={connector.adapter.name}>
            <button
              type="button"
              onClick={async () => {
                window.localStorage.setItem(
                  "walletConnector",
                  connector.adapter.name.toLowerCase().trim()
                );
                window.localStorage.setItem(
                  "walletConnectorName",
                  connector.adapter.name.trim()
                );
                window.localStorage.setItem(
                  "walletConnectorProvider",
                  connector.adapter.name.toLowerCase().trim()
                );
                window.localStorage.removeItem("walletDisconnected");
                dispatch(setVisibleConnectModal(false));

                await loginSol(connector.adapter.name);
              }}
            >
              <img
                src={
                  solWalletIcons[connector.adapter.name.toLowerCase().trim()] ||
                  connector.adapter.icon
                }
                alt=""
                width={90}
                height={32}
                loading="lazy"
                decoding="async"
              />
              <div>
                {connector.adapter.name} <span>Solana</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
