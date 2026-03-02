import { useCallback, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { syncTransactionStatus } from "@/store/payment-store";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

const POLL_INTERVAL_MS = 5000;

export function usePendingTransactionRecovery() {
  const dispatch = useAppDispatch();
  const { isOnline } = useNetworkStatus();
  const { pendingTransactionReference, transactionResult, isSyncing } =
    useAppSelector((state) => state.payment);

  const initializedReferenceRef = useRef<string | null>(null);

  const syncNow = useCallback(
    async (reference: string) => {
      if (!isOnline || isSyncing) return;
      await dispatch(syncTransactionStatus(reference));
    },
    [dispatch, isOnline, isSyncing],
  );

  useEffect(() => {
    if (!pendingTransactionReference || !isOnline) return;
    if (initializedReferenceRef.current === pendingTransactionReference) return;

    initializedReferenceRef.current = pendingTransactionReference;
    void syncNow(pendingTransactionReference);
  }, [pendingTransactionReference, isOnline, syncNow]);

  useEffect(() => {
    if (!pendingTransactionReference || !isOnline) return;

    const hasSameTransactionResult =
      transactionResult?.transactionNumber === pendingTransactionReference;
    const status = hasSameTransactionResult
      ? transactionResult?.status
      : "PENDING";

    if (status && status !== "PENDING") return;

    const interval = window.setInterval(() => {
      void syncNow(pendingTransactionReference);
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [pendingTransactionReference, isOnline, syncNow, transactionResult]);

  useEffect(() => {
    if (!pendingTransactionReference) {
      initializedReferenceRef.current = null;
    }
  }, [pendingTransactionReference]);
}
