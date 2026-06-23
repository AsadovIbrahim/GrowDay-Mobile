import React, { useState, useEffect } from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator, Vibration } from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faTrophy, faSnowflake, faBolt, faStar } from "@fortawesome/free-solid-svg-icons";
import { useMMKVString } from "react-native-mmkv";
import { useTranslation } from "react-i18next";
import { getPendingTournamentRewardFetch, claimTournamentRewardFetch } from "../utils/fetch";

const getLocalizedRank = (rank, lang) => {
  if (lang === "az") {
    const rem = rank % 10;
    if (rem === 0) {
      if (rank === 20) return `${rank}-ci`;
      return `${rank}-cu`;
    }
    if ([1, 2, 5, 7, 8].includes(rem)) return `${rank}-ci`;
    if ([3, 4].includes(rem)) return `${rank}-cü`;
    if (rem === 6) return `${rank}-cı`;
    if (rem === 9) return `${rank}-cu`;
    return `${rank}-ci`;
  }
  if (lang === "en") {
    const j = rank % 10, k = rank % 100;
    if (j === 1 && k !== 11) return `${rank}st`;
    if (j === 2 && k !== 12) return `${rank}nd`;
    if (j === 3 && k !== 13) return `${rank}rd`;
    return `${rank}th`;
  }
  if (lang === "tr" || lang === "de") {
    return `${rank}.`;
  }
  if (lang === "fr") {
    return rank === 1 ? "1er" : `${rank}e`;
  }
  if (lang === "it") {
    return `${rank}°`;
  }
  if (lang === "es") {
    return `${rank}.º`;
  }
  if (lang === "zh") {
    return `第${rank}`;
  }
  if (lang === "ru") {
    return `${rank}-е`;
  }
  return rank.toString();
};

export default function TournamentClaimPopup({ colors, onRewardClaimed }) {
  const { t, i18n } = useTranslation();
  const [token] = useMMKVString("accessToken");
  const [visible, setVisible] = useState(false);
  const [reward, setReward] = useState(null);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    const checkRewards = async () => {
      if (!token) return;
      try {
        const res = await getPendingTournamentRewardFetch(token);
        if (res?.success && res.data) {
          setReward(res.data);
          setVisible(true);
        }
      } catch (err) {
        console.log("Error checking pending tournament rewards:", err);
      }
    };

    checkRewards();
  }, [token]);

  const handleClaim = async () => {
    if (!token || claiming) return;
    setClaiming(true);
    try {
      const res = await claimTournamentRewardFetch(token);
      if (res?.success) {
        Vibration.vibrate([0, 10, 50, 100]); // Play success haptic
        setVisible(false);
        if (onRewardClaimed) {
          onRewardClaimed();
        }
      }
    } catch (err) {
      console.log("Error claiming weekly reward:", err);
    } finally {
      setClaiming(false);
    }
  };

  if (!visible || !reward) return null;

  const gameLabel = reward?.gameType
    ? reward.gameType === "SequenceMemory"
      ? t("games.sequence_memory")
      : reward.gameType === "StroopTest"
        ? t("games.stroop_test")
        : reward.gameType === "ReactionTime"
          ? t("games.reaction_game")
          : t("games.memory_match")
    : "";

  const renderSubtitle = () => {
    const leagueName = t(`games.league_${reward.league}`);
    const rankStr = getLocalizedRank(reward.rank, i18n.language || "az");
    const fullText = t("games.claim_popup_desc", { league: leagueName, rank: rankStr });

    const parts = [];
    let remaining = fullText;

    while (remaining.length > 0) {
      const idxLeague = remaining.indexOf(leagueName);
      const idxRank = remaining.indexOf(rankStr);

      if (idxLeague === -1 && idxRank === -1) {
        parts.push(<Text key={remaining}>{remaining}</Text>);
        break;
      }

      if (idxLeague !== -1 && (idxRank === -1 || idxLeague < idxRank)) {
        if (idxLeague > 0) {
          parts.push(<Text key={remaining.substring(0, idxLeague)}>{remaining.substring(0, idxLeague)}</Text>);
        }
        parts.push(
          <Text key={leagueName} style={{ fontFamily: "RedditSans-Bold", color: colors.primary }}>
            {leagueName}
          </Text>
        );
        remaining = remaining.substring(idxLeague + leagueName.length);
      } else {
        if (idxRank > 0) {
          parts.push(<Text key={remaining.substring(0, idxRank)}>{remaining.substring(0, idxRank)}</Text>);
        }
        parts.push(
          <Text key={rankStr} style={{ fontFamily: "RedditSans-Bold", color: "#FBBF24" }}>
            {rankStr}
          </Text>
        );
        remaining = remaining.substring(idxRank + rankStr.length);
      }
    }

    return (
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {parts}
      </Text>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.cardSecondary }]}>
          <View style={styles.trophyCircle}>
            <FontAwesomeIcon icon={faTrophy} size={54} color="#FBBF24" />
          </View>

          <Text style={[styles.title, { color: colors.text, marginBottom: 4 }]}>{t("games.weekly_tournament_ended")}</Text>
          {gameLabel ? (
            <Text style={{ fontSize: 16, fontFamily: "RedditSans-Bold", color: colors.primary, marginBottom: 12 }}>
              {gameLabel}
            </Text>
          ) : null}
          
          {renderSubtitle()}

          <Text style={[styles.rewardsLabel, { color: colors.textSecondary }]}>{t("games.rewards_label")}</Text>

          <View style={styles.rewardsList}>
            {reward.xpReward > 0 && (
              <View style={[styles.rewardItem, { backgroundColor: colors.card }]}>
                <FontAwesomeIcon icon={faStar} size={20} color="#FBBF24" />
                <Text style={[styles.rewardValue, { color: colors.text }]}>+{reward.xpReward} XP</Text>
              </View>
            )}

            {reward.streakFreezesReward > 0 && (
              <View style={[styles.rewardItem, { backgroundColor: colors.card }]}>
                <FontAwesomeIcon icon={faSnowflake} size={20} color="#3b82f6" />
                <Text style={[styles.rewardValue, { color: colors.text }]}>+{reward.streakFreezesReward} {t("games.streak_freeze_label")}</Text>
              </View>
            )}

            {reward.xpBoosterHoursReward > 0 && (
              <View style={[styles.rewardItem, { backgroundColor: colors.card }]}>
                <FontAwesomeIcon icon={faBolt} size={20} color="#eab308" />
                <Text style={[styles.rewardValue, { color: colors.text }]}>+{reward.xpBoosterHoursReward}h {t("games.xp_booster_label")}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={handleClaim}
            disabled={claiming}
            style={[styles.claimButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            {claiming ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.claimButtonText}>{t("games.claim_rewards_btn")}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  container: {
    width: "100%",
    borderRadius: 32,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 12,
  },
  trophyCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(251,191,36,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#FBBF24",
  },
  title: {
    fontSize: 22,
    fontFamily: "RedditSans-Bold",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "RedditSans-Regular",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 10,
    marginBottom: 24,
  },
  rewardsLabel: {
    fontSize: 11,
    fontFamily: "RedditSans-Bold",
    letterSpacing: 1.2,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  rewardsList: {
    width: "100%",
    gap: 10,
    marginBottom: 28,
  },
  rewardItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  rewardValue: {
    fontSize: 14,
    fontFamily: "RedditSans-Bold",
  },
  claimButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  claimButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "RedditSans-Bold",
  },
});
