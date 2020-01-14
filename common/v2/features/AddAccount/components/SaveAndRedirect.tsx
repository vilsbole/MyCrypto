import React, { useContext, useEffect } from 'react';
import { Route, Redirect } from 'react-router';

import { NotificationsContext, NotificationTemplates } from 'v2/features/NotificationsPanel';
import { generateUUID } from 'v2/utils';
import {
  AccountContext,
  AssetContext,
  findNextUnusedDefaultLabel,
  getNewDefaultAssetTemplateByNetwork,
  getNetworkById,
  AddressBookContext,
  StoreContext,
} from 'v2/services/Store';
import { Account, AddressBook, Asset, Network, FormData, WalletId } from 'v2/types';
import { getWeb3Config } from 'v2/utils/web3';

/*
  Create a new account in localStorage and redirect to dashboard.
*/
function SaveAndRedirect(payload: { formData: FormData }) {
  const { createAccountWithID, getAccountByAddressAndNetworkName } = useContext(AccountContext);
  const { createAddressBooks, addressBook } = useContext(AddressBookContext);
  const { displayNotification } = useContext(NotificationsContext);
  const { scanTokens, networks } = useContext(StoreContext);
  const { assets } = useContext(AssetContext);

  useEffect(() => {
    const network: Network | undefined = getNetworkById(payload.formData.network, networks);
    if (
      !network ||
      !payload.formData.account ||
      !!getAccountByAddressAndNetworkName(payload.formData.account, payload.formData.network)
    ) {
      displayNotification(NotificationTemplates.walletNotAdded, {
        address: payload.formData.account
      });
    } else {
      const walletType =
        payload.formData.accountType! === WalletId.WEB3
          ? WalletId[getWeb3Config().id]
          : payload.formData.accountType!;
      const newAsset: Asset = getNewDefaultAssetTemplateByNetwork(assets)(network);
      const newUUID = generateUUID();
      const account: Account = {
        address: payload.formData.account,
        networkId: payload.formData.network,
        wallet: walletType,
        dPath: payload.formData.derivationPath,
        assets: [{ uuid: newAsset.uuid, balance: '0', mtime: Date.now() }],
        transactions: [],
        favorite: false,
        mtime: 0
      };
      const newLabel: AddressBook = {
        label: findNextUnusedDefaultLabel(account.wallet)(addressBook),
        address: account.address,
        notes: '',
        network: account.networkId
      };
      createAddressBooks(newLabel);
      createAccountWithID(account, newUUID);
      scanTokens();
      displayNotification(NotificationTemplates.walletAdded, {
        address: account.address
      });
    }
  });

  return (
    <Route>
      <Redirect to="/dashboard" />
    </Route>
  );
}

export default SaveAndRedirect;
