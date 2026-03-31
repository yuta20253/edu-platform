class AddPrefectureRefToAddresses < ActiveRecord::Migration[7.1]
  def change
    add_reference :addresses, :prefecture, foreign_key: true

    remove_column :addresses, :prefecture, :string
  end
end
