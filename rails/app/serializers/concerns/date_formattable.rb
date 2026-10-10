# frozen_string_literal: true

# シリアライザで日付を「YYYY/MM/DD」の文字列に揃える。値がnilならnilを返す。
module DateFormattable
  DATE_FORMAT = '%Y/%m/%d'

  private

  def format_date(value)
    value&.strftime(DATE_FORMAT)
  end
end
