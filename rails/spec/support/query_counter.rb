# frozen_string_literal: true

# ブロック内で発行されたSQLを配列で返す(スキーマ取得のクエリは除く)。N+1の検証に使う。
module QueryCounter
  def capture_queries(&)
    queries = []
    callback = lambda { |_name, _start, _finish, _id, payload|
      queries << payload[:sql] if payload[:name] != 'SCHEMA'
    }
    ActiveSupport::Notifications.subscribed(callback, 'sql.active_record', &)
    queries
  end
end

RSpec.configure do |config|
  config.include QueryCounter
end
