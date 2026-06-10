import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useGameStore } from '@/store/gameStore';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useGameRealtime(roomId: string, password?: string) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [opponentJoined, setOpponentJoined] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [myReady, setMyReady] = useState(false);
  const [opponentRemaining, setOpponentRemaining] = useState(4);

  const { playerNumber, nickname, receiveAttack, recordOpponentHit, setTurn, movePlanes, addLog, myPlanes, setWinner, setPhase } = useGameStore();

  useEffect(() => {
    if (!roomId) return;

    const newChannel = supabase.channel(`room_${roomId}`, {
      config: {
        broadcast: { ack: true },
        presence: { key: nickname },
      },
    });

    newChannel
      .on('presence', { event: 'sync' }, () => {
        const state = newChannel.presenceState();
        const players = Object.keys(state);
        if (players.length > 1) {
          setOpponentJoined(true);
        }
      })
      .on('broadcast', { event: 'ready' }, (payload) => {
        if (payload.payload.player !== playerNumber) {
          setOpponentReady(true);
          addLog(`${payload.payload.nickname} đã sẵn sàng!`);
        }
      })
      .on('broadcast', { event: 'attack' }, (payload) => {
        if (payload.payload.player !== playerNumber) {
          const { x, y } = payload.payload;
          const result = receiveAttack(x, y);
          
          let logMsg = `Đối thủ bắn vào ô (${x}, ${y}) - `;
          if (result.hitType === 'hit_plane') logMsg += 'Trúng máy bay!';
          else if (result.hitType === 'hit_path') logMsg += 'Trúng đường bay (Phát hiện radar)!';
          else logMsg += 'Trượt!';
          addLog(logMsg);

          // Reply with result
          newChannel.send({
            type: 'broadcast',
            event: 'attack_result',
            payload: { x, y, result, player: playerNumber }
          });
        }
      })
      .on('broadcast', { event: 'attack_result' }, (payload) => {
        if (payload.payload.player !== playerNumber) {
          const { x, y, result } = payload.payload;
          recordOpponentHit(x, y, result.hitType);
          
          let logMsg = `Bạn bắn vào ô (${x}, ${y}) - `;
          if (result.hitType === 'hit_plane') logMsg += 'Phá hủy máy bay địch!';
          else if (result.hitType === 'hit_path') logMsg += 'Trúng đường bay địch (Radar)!';
          else logMsg += 'Trượt!';
          addLog(logMsg);

          // After attack, turn ends, planes move
          movePlanes();
          setTurn(playerNumber === 1 ? 2 : 1);
          newChannel.send({ type: 'broadcast', event: 'end_turn', payload: { player: playerNumber } });
        }
      })
      .on('broadcast', { event: 'end_turn' }, (payload) => {
        if (payload.payload.player !== playerNumber) {
          movePlanes(); // I also move my planes
          setTurn(playerNumber);
          addLog('Đến lượt bạn!');
        }
      })
      .on('broadcast', { event: 'sync_planes' }, (payload) => {
        if (payload.payload.player !== playerNumber) {
          setOpponentRemaining(payload.payload.remaining);
          if (payload.payload.remaining === 0) {
            setWinner(playerNumber);
            addLog('Bạn đã chiến thắng!');
          }
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          newChannel.track({ nickname, playerNumber });
        }
      });

    setChannel(newChannel);

    return () => {
      supabase.removeChannel(newChannel);
    };
  }, [roomId]);

  // When my planes change, sync remaining
  useEffect(() => {
    if (!channel || !isConnected) return;
    const remaining = myPlanes.filter(p => !p.isDestroyed).length;
    channel.send({
      type: 'broadcast',
      event: 'sync_planes',
      payload: { remaining, player: playerNumber }
    });

    if (remaining === 0 && myPlanes.length > 0) {
      setWinner(playerNumber === 1 ? 2 : 1);
      addLog('Bạn đã thua!');
    }
  }, [myPlanes, isConnected]);

  // Check if both ready
  useEffect(() => {
    if (myReady && opponentReady) {
      setPhase('playing');
      addLog('Trò chơi bắt đầu!');
    }
  }, [myReady, opponentReady]);

  const sendReady = () => {
    setMyReady(true);
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'ready',
        payload: { player: playerNumber, nickname }
      });
      addLog('Bạn đã sẵn sàng.');
    }
  };

  const sendAttack = (x: number, y: number) => {
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'attack',
        payload: { x, y, player: playerNumber }
      });
    }
  };

  return { isConnected, opponentJoined, sendReady, sendAttack, opponentReady, myReady, opponentRemaining };
}
