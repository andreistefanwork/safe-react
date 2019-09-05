// @flow
import type { Dispatch as ReduxDispatch, GetState } from 'redux'
import { EMPTY_DATA } from '~/logic/wallets/ethTransactions'
import { userAccountSelector } from '~/logic/wallets/store/selectors'
import fetchTransactions from '~/routes/safe/store/actions/fetchTransactions'
import { type GlobalState } from '~/store'
import { getGnosisSafeInstanceAt } from '~/logic/contracts/safeContracts'
import {
  approveTransaction,
  executeTransaction,
  CALL,
  type Notifications,
  DEFAULT_NOTIFICATIONS,
} from '~/logic/safe/transactions'

const createTransaction = (
  safeAddress: string,
  to: string,
  valueInWei: string,
  txData: string = EMPTY_DATA,
  openSnackbar: Function,
  shouldExecute?: boolean,
  notifications?: Notifications = DEFAULT_NOTIFICATIONS,
) => async (dispatch: ReduxDispatch<GlobalState>, getState: GetState<GlobalState>) => {
  const state: GlobalState = getState()

  const safeInstance = await getGnosisSafeInstanceAt(safeAddress)
  const from = userAccountSelector(state)
  const threshold = await safeInstance.getThreshold()
  const nonce = (await safeInstance.nonce()).toString()
  const isExecution = threshold.toNumber() === 1 || shouldExecute

  let txHash
  try {
    if (isExecution) {
      openSnackbar(notifications.BEFORE_EXECUTION_OR_CREATION, 'success')
      txHash = await executeTransaction(safeInstance, to, valueInWei, txData, CALL, nonce, from)
      openSnackbar(notifications.AFTER_EXECUTION, 'success')
    } else {
      openSnackbar(notifications.BEFORE_EXECUTION_OR_CREATION, 'success')
      txHash = await approveTransaction(safeInstance, to, valueInWei, txData, CALL, nonce, from)
      openSnackbar(notifications.CREATED_MORE_CONFIRMATIONS_NEEDED, 'success')
    }
  } catch (err) {
    openSnackbar(notifications.ERROR, '')
    console.error(`Error while creating transaction: ${err}`)
  }

  dispatch(fetchTransactions(safeAddress))

  return txHash
}

export default createTransaction
