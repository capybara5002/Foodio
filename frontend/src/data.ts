/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Restaurant, CommunityPost, ChatThread, AudioTour } from './types';

export const initialRestaurants: Restaurant[] = [
  {
    id: 'oc_dao',
    name: 'Oc Dao',
    rating: 4.8,
    priceRange: '$$$',
    category: 'Seafood',
    distance: '1.2 km away',
    address: '212B Alley, Nguyen Trai Street',
    area: 'District 1, Ho Chi Minh City',
    openingHours: '10:00 AM - 11:00 PM',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRKz2YnyvZVLIBglb9f9NCrquX4dKnpC6f_I1bacYnGKPkCdd4BK4ec4NSU3T0QDdjyD09txLee_GTY0faM2F7c2iZtVrQ5AWBSRzGLIRZO8qylHZIKMAGiBCW0yPydeRXezrelYofwryiKBLEy4t0THRWH9807xh6L2T4xl221ZBFmgNwcC8Xqx34_V1ZveUHvBcv4cs9R-oNv4eYz9I-wfJoaK1POgGMvhhjPVERdEp3OZI9gxH39c_gaG667-MpaMfEpaiArA',
    isVerified: true,
    replySpeed: 'Usually replies in 5m',
    dishes: [
      {
        id: 'dish_1',
        name: 'Garlic Butter Crab',
        price: 15.0,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB9AoCFv5FTuXDtHB3KuQOtWJ8WB1Gr-IB76xsA5QW5aEMSzRAJq9gQwRY0aIIhlT_cJK2axEQMpxCyO9cRvMwlWjFADwZHD4BNiDU5YmrgHrs7C-xW951m18TcN4NpHZvGLpyppjp96cDQFwILYrHxFeDd-TXeQQTIKNqgS_hHyhJ_PHtKBpBpvRg5R9G0Zs8-A2huwxSSTFS2EO06kPMcZPvk-rdE0W3OJXd81HxNLpUGrCvvBsVMgz07uSzAIOeiCdZhXgkbLA',
        description: 'Vivid, spicy stir-fried crab with rich garlic butter flavor.'
      },
      {
        id: 'dish_2',
        name: 'Grilled Oysters',
        price: 12.5,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWeVRp5E0pc1gFS0uGX2e69E8X_hSsB9NcoIGR24QvCo_e4IUb1ooOEUKbVYXSHGg9NRNGJQKfm9UxF_f9qZsBqtoBMNWZ5LLYJDqVe-mpc41RYKXjg2zvS5Zm4TjeTeXnBN3HXIQoXcfcV7Oh02RrC0cQlkSPjTJdOD4tQYvQGBActwsHfS06IrBi6FaB6NtC6xklQZHESrHpqJIxN8ElQYtO5nuXguFpN_Uj1HFA1MjfzqxfYqfb2aHfvwhDfI_Xs7GfiUV9zA',
        description: 'Fresh oysters grilled with scallion oil and toasted peanuts.'
      }
    ],
    reviews: [
      {
        id: 'rev_1',
        author: 'Jane Doe',
        role: 'Local Guide',
        rating: 5,
        avatar: 'JD',
        comment: 'Absolutely incredible spot hidden down an alley! The garlic butter sauce is to die for. Definitely get the bread to dip in the leftover sauce.'
      }
    ]
  },
  {
    id: 'oc_oanh',
    name: 'Oc Oanh',
    rating: 4.8,
    priceRange: '$$',
    category: 'Seafood',
    distance: '0.5 km away',
    address: '534 Vinh Khanh Street',
    area: 'District 4, Ho Chi Minh City',
    openingHours: '1:00 PM - 12:00 AM',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBvBXZhwmA3kgAZ09VO2HCHdpxB0rJDb45HXm300LV18iAcwTergSARo7HPAr7XjVF4_U9cg7wRKUmKEKGfhL99MTD-FA7gRJFTsQ7lLbO0-ZhRzXet2rSdNrjySNQoOrfQtxqvJ6I9Bphnpy-hwJQbRwuv53DE-CEpaD1jzITuWo5WN7ndMuPrF_VNHjLPnQq_jQ9sxUVBVGKO_IhQT_xKuXZecj9SLm--LE7QHUtiG5h5rZABbOG5pntK9mviAj6xDcVFF4mnyg',
    isVerified: true,
    replySpeed: 'Usually replies in 5m',
    dishes: [
      {
        id: 'dish_oanh_1',
        name: 'Spicy Tamarind Snails',
        price: 8.5,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBvBXZhwmA3kgAZ09VO2HCHdpxB0rJDb45HXm300LV18iAcwTergSARo7HPAr7XjVF4_U9cg7wRKUmKEKGfhL99MTD-FA7gRJFTsQ7lLbO0-ZhRzXet2rSdNrjySNQoOrfQtxqvJ6I9Bphnpy-hwJQbRwuv53DE-CEpaD1jzITuWo5WN7ndMuPrF_VNHjLPnQq_jQ9sxUVBVGKO_IhQT_xKuXZecj9SLm--LE7QHUtiG5h5rZABbOG5pntK9mviAj6xDcVFF4mnyg',
        description: 'Tamarind sweet and sour stir-fried snails with morning glory.'
      }
    ],
    reviews: [
      {
        id: 'rev_oanh_1',
        author: 'Minh Tuan',
        role: 'Snail aficionado',
        rating: 5,
        avatar: 'MT',
        comment: 'Super fast serving snail dishes right beside the vibrant street canal walk!'
      }
    ]
  },
  {
    id: 'pho_quynh',
    name: 'Phở Quỳnh',
    rating: 4.5,
    priceRange: '$',
    category: 'Noodles',
    distance: '1.8 km away',
    address: '323 Phạm Ngũ Lão',
    area: 'District 1, Ho Chi Minh City',
    openingHours: 'Open 24/7',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDg80a9zbMs0X2tiKHAsTlxXWDGB27MrJsaf02C4ZzN02ie7det-FVOhiCr2NXrI2HJ9_JEqQhAQgLRs3KRdBkxsOe8zo2NSFOQwijGr8T_bQXajyPQJVtawlTj6S3VAQBrZpAtbBhxsFvn2zHzCQFyDvX85GZpDFQVBz0tHlI3eUDjoYge7Kf5uaDICPliW9gwVaTJrlDXvatqaklFTuv63GBPSYOx76XOjviHsbd3KPsK_8-t6ubUk_pAtUtmFmcvY2c8SCNjYg',
    isVerified: false,
    replySpeed: 'Replies in standard hours',
    dishes: [
      {
        id: 'dish_pq_1',
        name: 'Beef Pho Special',
        price: 4.5,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDg80a9zbMs0X2tiKHAsTlxXWDGB27MrJsaf02C4ZzN02ie7det-FVOhiCr2NXrI2HJ9_JEqQhAQgLRs3KRdBkxsOe8zo2NSFOQwijGr8T_bQXajyPQJVtawlTj6S3VAQBrZpAtbBhxsFvn2zHzCQFyDvX85GZpDFQVBz0tHlI3eUDjoYge7Kf5uaDICPliW9gwVaTJrlDXvatqaklFTuv63GBPSYOx76XOjviHsbd3KPsK_8-t6ubUk_pAtUtmFmcvY2c8SCNjYg',
        description: 'Phở với đầy đủ bò tái, nạm, gầu, gân, bò viên thơm ngon sực nức.'
      }
    ],
    reviews: [
      {
        id: 'rev_pq_1',
        author: 'An Binh',
        role: 'Phở lover',
        rating: 4,
        avatar: 'AB',
        comment: 'Open all night, extremely popular near Bui Vien walking street!'
      }
    ]
  }
];

export const initialCommunityFeed: CommunityPost[] = [
  {
    id: 'post_1',
    author: 'foodie_explorer',
    handle: '@foodie_explorer',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRKZRdFtQr7QINgok2cIIj_I4mo7HJMI7i5ywrSs9Z-FpldNZJam-o0Inzqk-l4q9x7dEjZCSdbxyBG9GTzUHdlbB2drKAOGcd6-cTW4zsrmvKvckSZ_1jZyK1kaIqAl8k8O49SYBJO_04AYp1RJCKM-MbF7mPfP2ft_oHP4dPdDBwslbmjGzpvcU0A5pEyWXm837Es0Z7AgcbTvM2zx2gftDZiniFueWJf8phqDltfzBrhQiLeouhVErO1tWNv5-n1WvtpIAvlw',
    timeAgo: '2 giờ trước',
    rating: 4.8,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpr2EnihDo7YJZHA3VcPV3OeNsyUO6nnmiXjikoir5n1gh2EEx1TD07LZ3_i43I46Rp4NKXrFeg9Wlzo9UkjzCiP4Z3k541s4rLdKHlzjjmjn6gderLydyN3acGG4qM1oUNK-HhULNcRpzbjjyHavwgX3Dxqr8-fNxjjzDQokH73JAdt5mZcHm-L73ZkMOJ5Sj-7wgp6W1iJhxY-SmZDM5-k8DGWJkTtNvgqRDQQsIHeYDZFQVfwDpRTKUI_253bXi1ScmyRzUvg',
    content: 'Góc quán nhỏ nằm ẩn mình trong hẻm nhưng pizza ở đây thực sự là một tuyệt tác! Đế bánh mỏng giòn, phô mai ngập tràn. Chắc chắn sẽ quay lại thử thêm pasta. 🍕✨',
    locationName: "Mario's Pizzeria",
    likesCount: 245,
    commentsCount: 18,
    isLiked: false,
    isSaved: false
  },
  {
    id: 'post_2',
    author: 'street_bites',
    handle: '@street_bites',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCRTg6T7KqMpqvZC5IUs-vooTkTfdx4C6d-gvJVfvyqh6NBoq4vW80oUyA10K46cKb0NoVEnFBVG8SR2oWqjE5gUQlWJ4vWW_o_hg_GCeaD9lYKEsGZf_ploVn5bJXQB3mlY5qu2ayF_MfMQwgWnx6wCdPWOnlpccYtN06T71g6JVKBGSo_E9yuvnwJi4qhtEqmDpHIG-Y1jGndftPWEKcX79VOYH-L8bpA3csjEO3G0BMcyykJ0qtJbhMkIlssZVVx-X-yGRnAww',
    timeAgo: '5 giờ trước',
    rating: 4.0,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-2AxWBwYcyZ3OsuB1gmMUEqctm2YNhnFXw8CCGHSh9wNutghyqEJaXUU4GZe032czRAnIQMp1_TMzxVhUiuXm7We0XQrn0plr-1vPloS4bw6FgSoDow4o9fxaoRLjv4smFUxDUP0wOD5fzMJyr4CECeR2MOl44W7PsW2jGNkDbLMt-V7GshU3Z_IULg9LeVISl9yuioQZOijm9YtNR3AmQtZrncoves1PhOG06Q2X68m5wF9FKsOfdCOQ0sX_Sqvbczwe21wJOQ',
    content: 'Hương vị đường phố đích thực! Nước dùng đậm đà, sợi mì dai ngon. Chỗ ngồi hơi chật nhưng không khí rất nhộn nhịp. Một trải nghiệm ẩm thực đêm không thể bỏ qua. 🍜🥢',
    locationName: 'Hẻm Noodle Night',
    likesCount: 892,
    commentsCount: 45,
    isLiked: true,
    isSaved: false
  }
];

export const initialChatThreads: ChatThread[] = [
  {
    id: 'oc_oanh_thread',
    restaurantId: 'oc_oanh',
    name: 'Oc Oanh',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAhWof8xG-SLRjOpu6yia6QyQWv6OxEy6S4z1bY2PqKkW6jqHiBIsmOvG_6DkDohDHS_CbyBCA7a8Tp851g8T1QajWkkDBKRHauE0MK7AI1W8Au9EKKvQGXTeWmfGFrNjiY5zkF2zSZYBAPX-TCODjrU1-l1sVatI_AIpU5rjnl1qU_5eo_OdTWGrAWhWeKazxw-sRnWvqfi_EGmcZlI7VI8fTtHUFuyh_hOwUx11YNgpgIpWhTa6KE0eAPxIrt3vaTfwDsGkSnlA',
    statusText: 'Usually replies in 5m',
    lastMessageText: "Perfect. We'll hold an outdoor table for you. See you...",
    lastMessageTime: 'Now',
    unreadCount: 0,
    messages: [
      {
        id: 'msg_1',
        sender: 'user',
        text: 'Hi, do you have a table for 4 tonight around 7 PM?',
        timestamp: '4:30 PM',
        status: 'read'
      },
      {
        id: 'msg_2',
        sender: 'restaurant',
        text: 'Hello! Yes, we have space. Do you have a preference for indoor or our street-side outdoor seating?',
        timestamp: '4:32 PM'
      },
      {
        id: 'msg_3',
        sender: 'user',
        text: 'Outdoor would be amazing, thanks! We love the vibe there.',
        timestamp: '4:35 PM',
        status: 'read'
      },
      {
        id: 'msg_4',
        sender: 'restaurant',
        text: "Perfect. We'll hold an outdoor table for you. See you at 7 PM. Let us know if you need to adjust the time!",
        timestamp: 'Just now'
      }
    ]
  },
  {
    id: 'pho_quynh_thread',
    restaurantId: 'pho_quynh',
    name: 'Phở Quỳnh',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZqCeNm5IsfZ_YY8-efaFSVUlbd6SKoh3qY9iqvhm2Hn7i6XE9rWmaFZPDVdihMVTxP7nxzu7V2oPo0PzVksJLUQVY05wdqQ0tNCYHgesFLmXBRDpfpKyC0Ewx4JVqce3Fd3S4yroIC5_crsaMAxily8GUG5f3V2QWL7IHReqtGN2yVglHN28nhF3td8MBiS4Gj1WZmXa-GxGfUZ7wYvqsmfB_XNjyDUg-rhsG86tki7sdZTK09smSx5Yu2IClx28t4hrWF14Kyg',
    statusText: 'Replies in few hours',
    lastMessageText: 'Your reservation is confirmed!',
    lastMessageTime: '10:42 AM',
    unreadCount: 1,
    messages: [
      {
        id: 'msg_bm_1',
        sender: 'user',
        text: 'I would like to book a table for tomorrow morning please.',
        timestamp: '10:30 AM',
        status: 'read'
      },
      {
        id: 'msg_bm_2',
        sender: 'restaurant',
        text: 'Your reservation is confirmed!',
        timestamp: '10:42 AM'
      }
    ]
  },
  {
    id: 'banh_mi_25_thread',
    restaurantId: 'banh_mi_25',
    name: 'Banh Mi 25',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCRdNkEUJC3ejhstYUV1okMOJemKVieE_I6gRSmZb0Gt-AYZIP3zk_HVHeiJIoYdk0qtC-BWk_TT9_pYxarFG4bHLL0_7FjUBqWiDeekr9TvJi9N2AHXNRQAUrK4hyTX8pqo2p-5LkGfCN0H1n7BUFwb3Jnlm4nsgwAd2wvV83lfZE4-Voy-GnGPMJOIuQHONNPI-NqJc1lo2hfntrY1aTXd6RZLzQC80AzyDQ20KqQ8NEKZD98zaVwPGtOQ8-Q_ZhcPMTFX_F2kA',
    statusText: 'Replies in 1h',
    lastMessageText: 'We are sold out for today, sorry!',
    lastMessageTime: 'Yesterday',
    unreadCount: 0,
    messages: [
      {
        id: 'msg_bm25_1',
        sender: 'user',
        text: 'Do you still have original paté banh mi?',
        timestamp: 'Yesterday',
        status: 'read'
      },
      {
        id: 'msg_bm25_2',
        sender: 'restaurant',
        text: 'We are sold out for today, sorry!',
        timestamp: 'Yesterday'
      }
    ]
  }
];

export const initialAudioTours: AudioTour[] = [
  {
    id: 'tour_1',
    title: 'Midnight Snacking',
    location: 'Shinjuku & Kabukicho Alleys',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJpqP8yJWRNVXzkOfHkGSmuwdmbu3UJ4nkoQf71CfhAm4r6pkEYuLOHS8c7h33iHhKvYNzaCt0Zc5A6_r3TDUOD7ZzwDKFIC_-6IRhIBA9C9iXr7zMnFfKqHaJmwzR6q_qGTUTujKEC95oBHznBhraHd9Zj902Uod77uJXHumVUNnFyJ60rvi9KlKYqu8gPpclVCUbbJ37ITUh7F6Hag6QSBFW-9N-8GHgSrGDvSzbFf44980sxKjNXYi8XlMt2an5xqHn3_nOUQ',
    mapImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAT6uSsv8DcqjZ3seIm1ZX-aixsu7NbzVtdfcZ9SXHee375sV8a5Jn8gtcYFoMaG_k3eRSb0tdrLRda5VA8onno002hYEI89BxUlyS8rQAKTwcd5-8LC9ycd-p2xPTmPZNn73K4o3vo94oNhQhI6qU-yOpydiJrKOTfMm3oc1d3p-2ThDS3OIVKALm_K8nPLhpPqzVAtcxsnduH4_JGhYkPkrH9Kc9rtl7W1xcbM3KXgzXM-Ob6GVuqDDIWxzQgRjCQ1GHH3RkA5w',
    isTrending: true,
    rating: 4.9,
    duration: '2.5 hrs',
    stopsCount: 6,
    vibe: 'Energetic',
    description: 'Immersive culinary journeys guided by local experts. A vibrant nighttime adventure into Shinjuku & Kabukicho alleyways.'
  },
  {
    id: 'tour_2',
    title: 'Seafood Heaven Tour',
    location: 'Tsukiji Waterfront Area',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA77V7QSBu828sHy-FMiO-oEFmr7NAYLSdGjfHr-2Gfgt5p_Famqr2-CVEYc9jKULPyd4Ce7wzcoxOVP42V6rWEL7b40I9WrkqUFK1pCuCkiXr9k7GwutuPv6TuuS8nBzoUmYjSMkMCNeOn5qxuBVxXkF-IDCBVp8zPVITf6tAszjRFIstFOgftUuAj6NvjkLnJIzRRf1VBoT0-94J8bTOXFMrxNqBrhbrWpRVdZgJ0RxCGj_tOC-mZkwRgBMWXC8rRHhnnwtYY4A',
    mapImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDO7LVODm2hMOoDaD3vLgthX6vZt2CJNKAjhw0PEZXb8bZ9uYcX6QDoiz97VDKQ3KldUER1hjkhBEoq6jIuosxZTl0pnPy0UgVGDesB_b2vTKSTfnApD3chWyCSB8jF85OncG-e66RGYuelXQAphatF7ew7qXePLBO6rm1-QYa8_FLd-oDdTUdY4btLm2U0zUbRlp3IMnhJS0iTts3ROL0WDzCTBgm7teCWNapHuC6a5o2yfz4UQPtfSmglMcs-_w2hYFWwQ44DCg',
    isTrending: false,
    rating: 4.7,
    duration: '1.5 hrs',
    stopsCount: 4,
    vibe: 'Premium',
    description: 'Dive into the freshest catches of the day with our expert fishmonger guide. Includes private tastings.'
  },
  {
    id: 'tour_3',
    title: 'Historic Cafe Crawl',
    location: 'Kyoto Hidden Teahouses',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDDu-DCs7W45MEGIjiqFiKCsxjEX2HrEHqn2XCS8ICOIGI6t91azXI2z2MT2dSgj_g2Mm5nuV58n-xXlVS1sGIv8x_9O5l7vNJQldV8zJYQ1svdu-60K3cMxCHJW3Mra8YwvW_Ez0wPZ3sVlUsWygaTb3xITm2i-MdEiI4foCD4TmygJn3KX6vC3_gEt-sjb2TICHzn1gX35FQGWLxl0ij2TPSMgQaKjtT6xq_1Eyjp9V3deVsJlbpfEi0Hkg4itF4VhDbdo6Yp-A',
    mapImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB9TVUb5MiuoBntCO89G6HrOtYh1YipdhZhrIRrKZgMJnPj5HKf5xNz_Y5NX2Y4pVhsTaYiaQifvOy8tETp10eZHi66-jYTNw2nfRY7lDGzHII-_cEd5RmbIcZzdTm_ytodV2dOVoNsypJdwK5x2wJTWzVbmxwfMWpCzV9UEoPyFS1DKSS0ob5R1fB5jiEDs1hKE9Lwzv9tF4LdsJ6gusYJCwzYFs-F2GXyg8SBO9Nmcy0iwKnVg_5XDSC7p21B9atT5KJqJw_JLg',
    isTrending: false,
    rating: 4.8,
    duration: '3.0 hrs',
    stopsCount: 5,
    vibe: 'Nostalgic',
    description: 'Discover century-old roasteries and hidden tea houses tucked away in narrow heritage lanes.'
  }
];

export const PRESET_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBpr2EnihDo7YJZHA3VcPV3OeNsyUO6nnmiXjikoir5n1gh2EEx1TD07LZ3_i43I46Rp4NKXrFeg9Wlzo9UkjzCiP4Z3k541s4rLdKHlzjjmjn6gderLydyN3acGG4qM1oUNK-HhULNcRpzbjjyHavwgX3Dxqr8-fNxjjzDQokH73JAdt5mZcHm-L73ZkMOJ5Sj-7wgp6W1iJhxY-SmZDM5-k8DGWJkTtNvgqRDQQsIHeYDZFQVfwDpRTKUI_253bXi1ScmyRzUvg',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB-2AxWBwYcyZ3OsuB1gmMUEqctm2YNhnFXw8CCGHSh9wNutghyqEJaXUU4GZe032czRAnIQMp1_TMzxVhUiuXm7We0XQrn0plr-1vPloS4bw6FgSoDow4o9fxaoRLjv4smFUxDUP0wOD5fzMJyr4CECeR2MOl44W7PsW2jGNkDbLMt-V7GshU3Z_IULg9LeVISl9yuioQZOijm9YtNR3AmQtZrncoves1PhOG06Q2X68m5wF9FKsOfdCOQ0sX_Sqvbczwe21wJOQ',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDg80a9zbMs0X2tiKHAsTlxXWDGB27MrJsaf02C4ZzN02ie7det-FVOhiCr2NXrI2HJ9_JEqQhAQgLRs3KRdBkxsOe8zo2NSFOQwijGr8T_bQXajyPQJVtawlTj6S3VAQBrZpAtbBhxsFvn2zHzCQFyDvX85GZpDFQVBz0tHlI3eUDjoYge7Kf5uaDICPliW9gwVaTJrlDXvatqaklFTuv63GBPSYOx76XOjviHsbd3KPsK_8-t6ubUk_pAtUtmFmcvY2c8SCNjYg',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBvBXZhwmA3kgAZ09VO2HCHdpxB0rJDb45HXm300LV18iAcwTergSARo7HPAr7XjVF4_U9cg7wRKUmKEKGfhL99MTD-FA7gRJFTsQ7lLbO0-ZhRzXet2rSdNrjySNQoOrfQtxqvJ6I9Bphnpy-hwJQbRwuv53DE-CEpaD1jzITuWo5WN7ndMuPrF_VNHjLPnQq_jQ9sxUVBVGKO_IhQT_xKuXZecj9SLm--LE7QHUtiG5h5rZABbOG5pntK9mviAj6xDcVFF4mnyg'
];
