import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export const useCategories = () => {
  const [categories, setCategories] = useState([]);

  const fetchCategories = async () => {
    const { data, error } = await supabase.from("Categories").select("*");
    if (!error) setCategories(data);
  };

  useEffect(() => {
    fetchCategories();
    const subscription = supabase
      .channel("public:Categories")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Categories" },
        () => fetchCategories()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return categories;
};

export const useProducts = () => {
  const [products, setProducts] = useState([]);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from("Products").select("*");
    if (!error && data) {
      const transformed = data.map((item) => ({
        ...item,
        id: item.Id,
      }));
      setProducts(transformed);
    }
  };

  useEffect(() => {
    fetchProducts();
    const subscription = supabase
      .channel("public:Products")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Products" },
        () => fetchProducts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return products;
};
