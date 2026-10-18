# frozen_string_literal: true

# 集計期間(@from〜@to、両端を含むDate)を持つ分析系のクラスで使う
module AnalyticsPeriodable
  private

  def period_days
    (@to - @from + 1).to_i
  end

  # DBはUTCで保存しているため、JSTの日付の範囲を時刻の範囲にして絞り込む
  def jst_range
    @from.in_time_zone.beginning_of_day..@to.in_time_zone.end_of_day
  end
end
