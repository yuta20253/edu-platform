# frozen_string_literal: true

module Admin
  # 管理者ダッシュボードのお知らせカード用。
  # 一覧画面と違い本文・配信対象・配信者は表示しないため、
  # announcement_targets / publisher を引かない軽量なシリアライザにしている。
  class DashboardAnnouncementSerializer < ActiveModel::Serializer
    attributes :id, :title, :status, :published_at, :scheduled_at, :created_at
  end
end
