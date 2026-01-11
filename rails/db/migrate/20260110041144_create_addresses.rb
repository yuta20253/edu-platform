class CreateAddresses < ActiveRecord::Migration[7.1]
  def change
    create_table :addresses do |t|
      t.string :postal_code, limit: 8, null: false
      t.string :prefecture, limit: 20, null: false
      t.string :city, limit: 50, null: false
      t.string :town, limit: 50
      t.string :street_address, limit: 100
      t.datetime :deleted_at

      t.timestamps
    end
  end
end
