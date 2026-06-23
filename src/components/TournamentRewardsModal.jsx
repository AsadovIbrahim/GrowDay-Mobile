import React, { useState } from "react";
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faTimes, faTrophy, faCrown, faMedal, faAward, faStar, faSnowflake, faBolt } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";

const LEAGUE_NAMES = {
  1: "Bürünc Liqa",
  2: "Gümüş Liqa",
  3: "Qızıl Liqa",
  4: "Yaqut Liqa",
  5: "Almaz Liqa",
};

const LEAGUE_COLORS = {
  1: "#CD7F32", // Bronze
  2: "#94A3B8", // Silver
  3: "#FBBF24", // Gold
  4: "#EF4444", // Ruby
  5: "#3B82F6", // Diamond
};

const REWARDS_DATA = {
  1: {
    first: { xp: 150, freezes: 1, booster: 0 },
    second: { xp: 100, freezes: 1, booster: 0 },
    third: { xp: 50, freezes: 0, booster: 0 },
    others: { xp: 15 },
  },
  2: {
    first: { xp: 250, freezes: 1, booster: 24 },
    second: { xp: 150, freezes: 1, booster: 0 },
    third: { xp: 100, freezes: 0, booster: 0 },
    others: { xp: 20 },
  },
  3: {
    first: { xp: 400, freezes: 2, booster: 24 },
    second: { xp: 250, freezes: 1, booster: 0 },
    third: { xp: 150, freezes: 0, booster: 0 },
    others: { xp: 25 },
  },
  4: {
    first: { xp: 500, freezes: 2, booster: 48 },
    second: { xp: 300, freezes: 1, booster: 24 },
    third: { xp: 200, freezes: 1, booster: 0 },
    others: { xp: 30 },
  },
  5: {
    first: { xp: 600, freezes: 2, booster: 48, hasCrown: true },
    second: { xp: 400, freezes: 1, booster: 24 },
    third: { xp: 250, freezes: 1, booster: 0 },
    others: { xp: 35 },
  },
};

const RANK_CONFIG = {
  1: { label: "1-ci Yer", icon: faTrophy, color: LEAGUE_COLORS[3] },
  2: { label: "2-ci Yer", icon: faMedal, color: LEAGUE_COLORS[2] },
  3: { label: "3-cü Yer", icon: faMedal, color: LEAGUE_COLORS[1] },
  4: { label: "İştirakçı", icon: faAward, color: "#94A3B8" },
};

export default function TournamentRewardsModal({ visible, onClose, currentLeague, colors }) {
  const { t } = useTranslation();
  const [selectedLeague, setSelectedLeague] = useState(currentLeague || 1);

  const rewards = REWARDS_DATA[selectedLeague];

  const renderRewardItem = (rankNum, reward) => {
    const config = RANK_CONFIG[rankNum];
    const rankLabel = rankNum === 1 ? t("games.rank_1") 
                    : rankNum === 2 ? t("games.rank_2") 
                    : rankNum === 3 ? t("games.rank_3") 
                    : t("games.rank_others");

    return (
      <View style={[styles.rewardRow, { backgroundColor: colors.card + "50" }]}>
        <View style={styles.rankContainer}>
          <FontAwesomeIcon icon={config.icon} size={15} color={config.color} style={{ marginRight: 6 }} />
          <Text style={[styles.rankText, { color: colors.text }]}>
            {rankLabel}
          </Text>
        </View>
        <View style={styles.perksContainer}>
          <View style={[styles.perkBadge, { backgroundColor: colors.primary + "15" }]}>
            <FontAwesomeIcon icon={faStar} size={11} color={colors.primary} />
            <Text style={[styles.perkText, { color: colors.primary }]}>+{reward.xp} XP</Text>
          </View>
          {reward.freezes > 0 && (
            <View style={[styles.perkBadge, { backgroundColor: "#3b82f615" }]}>
              <FontAwesomeIcon icon={faSnowflake} size={11} color="#3b82f6" />
              <Text style={[styles.perkText, { color: "#3b82f6" }]}>+{reward.freezes} ❄️</Text>
            </View>
          )}
          {reward.booster > 0 && (
            <View style={[styles.perkBadge, { backgroundColor: "#eab30815" }]}>
              <FontAwesomeIcon icon={faBolt} size={11} color="#eab308" />
              <Text style={[styles.perkText, { color: "#ca8a04" }]}>{reward.booster}h ⚡</Text>
            </View>
          )}
          {reward.hasCrown && (
            <View style={[styles.perkBadge, { backgroundColor: "#a855f715" }]}>
              <FontAwesomeIcon icon={faCrown} size={11} color="#a855f7" />
              <Text style={[styles.perkText, { color: "#a855f7" }]}>👑 {t("games.crown")}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.cardSecondary }]}>
          <View style={styles.header}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <FontAwesomeIcon icon={faCrown} size={22} color="#FBBF24" />
              <Text style={[styles.title, { color: colors.text }]}>{t("games.tournament_rewards")}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.card }]}>
              <FontAwesomeIcon icon={faTimes} size={16} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* League tabs */}
          <View style={styles.tabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {[1, 2, 3, 4, 5].map((l) => (
                <TouchableOpacity
                  key={l}
                  onPress={() => setSelectedLeague(l)}
                  style={[
                    styles.tabButton,
                    {
                      borderColor: selectedLeague === l ? LEAGUE_COLORS[l] : colors.border + "30",
                      backgroundColor: selectedLeague === l ? LEAGUE_COLORS[l] + "15" : "transparent",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color: selectedLeague === l ? LEAGUE_COLORS[l] : colors.textSecondary,
                        fontFamily: selectedLeague === l ? "RedditSans-Bold" : "RedditSans-Medium",
                      },
                    ]}
                  >
                    {t(`games.league_${l}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView style={styles.contentList} showsVerticalScrollIndicator={false}>
            <Text style={[styles.descText, { color: colors.textSecondary }]}>
              {t("games.rewards_description")}
            </Text>

            {renderRewardItem(1, rewards.first)}
            {renderRewardItem(2, rewards.second)}
            {renderRewardItem(3, rewards.third)}
            {renderRewardItem(4, rewards.others)}

            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    width: "100%",
    maxHeight: "80%",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: "RedditSans-Bold",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  tabsContainer: {
    marginBottom: 16,
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  tabText: {
    fontSize: 13,
  },
  contentList: {
    flexGrow: 0,
  },
  descText: {
    fontSize: 12,
    fontFamily: "RedditSans-Regular",
    lineHeight: 18,
    marginBottom: 20,
  },
  rewardRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
  },
  rankContainer: {
    width: "35%",
    flexDirection: "row",
    alignItems: "center",
  },
  rankText: {
    fontSize: 14,
    fontFamily: "RedditSans-Bold",
  },
  perksContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  xpText: {
    fontSize: 14,
    fontFamily: "RedditSans-Bold",
  },
  perkBadge: {
    backgroundColor: "rgba(59,130,246,0.1)",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  perkText: {
    fontSize: 10,
    color: "#3b82f6",
    fontFamily: "RedditSans-Bold",
  },
  crownText: {
    fontSize: 10,
    color: "#a855f7",
    fontFamily: "RedditSans-Bold",
  },
});
