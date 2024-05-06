//@ts-nocheck
"use server";

import { sql } from "kysely";
import { DEFAULT_PAGE_SIZE } from "../../constant";
import { db } from "../../db";
import { InsertProducts, UpdateProducts } from "@/types";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/utils/authOptions";
import { cache } from "react";


export async function getProducts(pageNo:number,pageSize:number,searchParams:any) {
  try {
    
    const {sortBy,brandId,categoryId,priceRangeTo,gender,occasions,discount}=searchParams
    
    let products;
    
    let dbQuery = db.selectFrom("products").selectAll("products")
    if(sortBy){
      const sort = sortBy?.split('-');
      dbQuery=dbQuery.orderBy(sort[0], sort[1]=="asc"?"asc":"desc")
    } 
    if(brandId){
      //to do
      dbQuery=dbQuery
    }
    if(categoryId){
      //to do
      const catArr=categoryId.split(',')
      console.log(catArr)
      const productIdArr=await db.selectFrom("product_categories").select('product_id')
      .where('category_id', 'in', catArr)
      .execute()
      const productList=productIdArr.map((productId)=>{return productId.product_id})                  
      dbQuery=dbQuery.where("id","in",productList)
    }
    if(priceRangeTo){
      dbQuery=dbQuery.where('price',"<=",priceRangeTo)
    }
    if(gender){
      dbQuery=dbQuery.where('gender',"=",gender)
    }
    if(occasions){
      dbQuery=dbQuery.where('occasion',"like",occasions)
    }
    if(discount){
      let discPart=discount.split('-')
      dbQuery=dbQuery.where('discount',">=",discPart[0])
      dbQuery=dbQuery.where('discount',"<=",discPart[1])
    }  
    
    products = await dbQuery
       .distinct()
       .offset((pageNo - 1) * pageSize)
       .limit(pageSize)
       .execute();

    const {count} = await db.selectFrom("products").select(db.fn.count("products.id").as("count")).executeTakeFirst()
       
    
    const lastPage = Math.ceil(count / pageSize);
    
    const numOfResultsOnCurPage = products.length;
    
    return { products, count, lastPage, numOfResultsOnCurPage };
  } catch (error) {
    throw error;
  }
}

export const getProduct = cache(async function getProduct(productId: number) {
  
  try {
    const product = await db
      .selectFrom("products")
      .selectAll()
      .where("id", "=", productId)
      .execute();

    return product;
  } catch (error) {
    return { error: "Could not find the product" };
  }
});

async function enableForeignKeyChecks() {
  await sql`SET foreign_key_checks = 1`.execute(db);
}

async function disableForeignKeyChecks() {
  await sql`SET foreign_key_checks = 0`.execute(db);
}

export async function deleteProduct(productId: number) {
  try {
    await disableForeignKeyChecks();
    await db
      .deleteFrom("product_categories")
      .where("product_categories.product_id", "=", productId)
      .execute();
    await db
      .deleteFrom("reviews")
      .where("reviews.product_id", "=", productId)
      .execute();

    await db
      .deleteFrom("comments")
      .where("comments.product_id", "=", productId)
      .execute();

    await db.deleteFrom("products").where("id", "=", productId).execute();

    await enableForeignKeyChecks();
    revalidatePath("/products");
    return { message: "success" };
  } catch (error) {
    return { error: "Something went wrong, Cannot delete the product" };
  }
}

export async function MapBrandIdsToName(brandsId) {
  const brandsMap = new Map();
  try {
    for (let i = 0; i < brandsId.length; i++) {
      const brandId = brandsId.at(i);
      const brand = await db
        .selectFrom("brands")
        .select("name")
        .where("id", "=", +brandId)
        .executeTakeFirst();
      brandsMap.set(brandId, brand?.name);
    }
    return brandsMap;
  } catch (error) {
    throw error;
  }
}

export async function getAllProductCategories(products: any) {
  try {
    const productsId = products.map((product) => product.id);
    const categoriesMap = new Map();

    for (let i = 0; i < productsId.length; i++) {
      const productId = productsId.at(i);
      const categories = await db
        .selectFrom("product_categories")
        .innerJoin(
          "categories",
          "categories.id",
          "product_categories.category_id"
        )
        .select("categories.name")
        .where("product_categories.product_id", "=", productId)
        .execute();
      categoriesMap.set(productId, categories);
    }
    return categoriesMap;
  } catch (error) {
    throw error;
  }
}

export async function getProductCategories(productId: number) {
  try {
    const categories = await db
      .selectFrom("product_categories")
      .innerJoin(
        "categories",
        "categories.id",
        "product_categories.category_id"
      )
      .select(["categories.id", "categories.name"])
      .where("product_categories.product_id", "=", productId)
      .execute();

    return categories;
  } catch (error) {
    throw error;
  }
}

function getBrandIds(brands:string[]){
  let arr=[]
  brands.map((brand)=>{
    arr.push(brand.value)
  })
  return arr
}

function getOccasions(occasions:string[]){
  let arr=""
  occasions.map((occasion)=>{
    arr=arr.length?arr+","+occasion.value:arr+occasion.value
  })
  
  return arr
}
export async function addProduct(product:InsertProducts) {
  try{
    const {colors,description,discount,gender,image_url,name,old_price,rating}=product
    const price=product.old_price*((100-product.discount)/100).toFixed(2)
    const brands=getBrandIds(product.brands)
    const occasion=getOccasions(product.occasion)
    const res= await db
      .insertInto("products")
      .values({
        brands:JSON.stringify(brands)
        ,colors
        ,description
        ,discount
        ,gender
        ,image_url
        ,name
        ,occasion
        ,old_price
        ,rating
        ,price
      })
      .execute();
      
        for (const row of product.categories) {
        await db.insertInto("product_categories")
          .values({
            category_id:row.value,
            product_id:res[0].insertId
          })
          .execute();
      }  
  }catch(err){
    throw err
  }
}
export async function editProduct(product:InsertProducts,id:number) {
  try{
    const {categories}=product
    let productObj={...product}
    const price=productObj.old_price*((100-productObj.discount)/100).toFixed(2)
    const brands=getBrandIds(productObj.brands)
    const occasion=getOccasions(productObj.occasion)
    
    //remove categories and image url(if empty) from productObj 
    delete productObj.categories
    productObj=productObj.image_url==""?delete productObj.image_url:productObj
    
    //delete product categories in product_categories
    await db.deleteFrom("product_categories").where("product_id","=",id).execute()

    //update values in products table
    await db.updateTable("products")
    .set({
      ...productObj,  
      brands:JSON.stringify(brands),
      occasion,
      price
    })
    .where("id","=",id)
    .execute()

    //add new categories to product_categories
    for (const row of categories) {
      await db.insertInto("product_categories")
        .values({
          category_id:row.value,
          product_id:id
        })
        .execute();
    }  

  }catch(err){
    throw err
  }
}
