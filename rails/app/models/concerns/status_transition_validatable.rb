# frozen_string_literal: true

# includeしたモデルに `STATUS_TRANSITIONS` 定数(遷移前ステータス => 許可される遷移先の配列)
# を定義させ、statusの不正な遷移をバリデーションで弾く。
# Announcement・InterviewRequestで同じ形のバリデーションが個別実装されていたため共通化した。
module StatusTransitionValidatable
  extend ActiveSupport::Concern

  included do
    validate :valid_status_transition
  end

  private

  def valid_status_transition
    return unless persisted?
    return unless will_save_change_to_status?

    from = status_was
    to = status

    return if self.class::STATUS_TRANSITIONS[from].include?(to)

    errors.add(:status, "#{from} から #{to} へは変更できません")
  end
end
