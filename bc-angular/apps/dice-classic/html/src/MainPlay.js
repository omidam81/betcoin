function MainPlay(kcConfig) {
    this.getDiceSprite = function(i, front) {
        var sprites = {
            "0": {
                x: 1288,
                y: 594,
                width: 112,
                height: 118
            },
            "1": {
                x: 590,
                y: 354,
                width: 114,
                height: 116
            },
            "10": {
                x: 590,
                y: 592,
                width: 112,
                height: 118
            },
            "11": {
                x: 1868,
                y: 478,
                width: 112,
                height: 118
            },
            "12": {
                x: 1402,
                y: 594,
                width: 114,
                height: 118
            },
            "13": {
                x: 472,
                y: 354,
                width: 116,
                height: 116
            },
            "14": {
                x: 354,
                y: 354,
                width: 116,
                height: 116
            },
            "15": {
                x: 1516,
                y: 2,
                width: 116,
                height: 114
            },
            "16": {
                x: 1636,
                y: 596,
                width: 116,
                height: 118
            },
            "17": {
                x: 1518,
                y: 596,
                width: 116,
                height: 118
            },
            "18": {
                x: 238,
                y: 354,
                width: 114,
                height: 116
            },
            "19": {
                x: 1868,
                y: 240,
                width: 112,
                height: 116
            },
            "2": {
                x: 1058,
                y: 594,
                width: 116,
                height: 118
            },
            "20": {
                x: 1636,
                y: 476,
                width: 112,
                height: 118
            },
            "21": {
                x: 1752,
                y: 238,
                width: 114,
                height: 116
            },
            "22": {
                x: 940,
                y: 594,
                width: 116,
                height: 118
            },
            "23": {
                x: 1170,
                y: 2,
                width: 116,
                height: 114
            },
            "24": {
                x: 120,
                y: 354,
                width: 116,
                height: 116
            },
            "25": {
                x: 2,
                y: 354,
                width: 116,
                height: 116
            },
            "26": {
                x: 822,
                y: 594,
                width: 116,
                height: 118
            },
            "27": {
                x: 704,
                y: 594,
                width: 116,
                height: 118
            },
            "28": {
                x: 1636,
                y: 238,
                width: 114,
                height: 116
            },
            "29": {
                x: 1402,
                y: 2,
                width: 112,
                height: 114
            },
            "3": {
                x: 1052,
                y: 2,
                width: 116,
                height: 114
            },
            "30": {
                x: 1176,
                y: 594,
                width: 110,
                height: 118
            },
            "31": {
                height: 118,
                width: 112,
                x: 940,
                y: 474
            },
            "32": {
                height: 118,
                width: 114,
                x: 356,
                y: 592
            },
            "33":
            {
                height: 116,
                width: 116,
                x: 1288,
                y: 236
            },
            "34":
            {
                height: 116,
                width: 116,
                x: 1170,
                y: 236
            },
            "35":
            {
                height: 114,
                width: 116,
                x: 820,
                y: 2
            },
            "36":
            {
                height: 118,
                width: 116,
                x: 472,
                y: 592
            },
            "37":
            {
                height: 118,
                width: 116,
                x: 238,
                y: 592
            },
            "38":
            {
                height: 116,
                width: 114,
                x: 1406,
                y: 236
            },
            "39":
            {
                height: 116,
                width: 112,
                x: 1522,
                y: 238
            },
            "4":
            {
                height: 116,
                width: 116,
                x: 936,
                y: 236
            },
            "40":
            {
                height: 118,
                width: 112,
                x: 472,
                y: 472
            },
            "41":
            {
                height: 116,
                width: 114,
                x: 1054,
                y: 236
            },
            "42":
            {
                height: 118,
                width: 116,
                x: 120,
                y: 592
            },
            "43":
            {
                height: 116,
                width: 116,
                x: 818,
                y: 236
            },
            "44":
            {
                height: 116,
                width: 116,
                x: 354,
                y: 236
            },
            "45":
            {
                height: 116,
                width: 116,
                x: 236,
                y: 236
            },
            "46":
            {
                height: 118,
                width: 116,
                x: 2,
                y: 592
            },
            "47":
            {
                height: 118,
                width: 116,
                x: 1750,
                y: 476
            },
            "48":
            {
                height: 116,
                width: 114,
                x: 702,
                y: 236
            },
            "49":
            {
                height: 114,
                width: 112,
                x: 1288,
                y: 2
            },
            "5":
            {
                height: 116,
                width: 116,
                x: 118,
                y: 236
            },
            "50":
            {
                height: 118,
                width: 110,
                x: 1406,
                y: 474
            },
            "51":
            {
                height: 118,
                width: 112,
                x: 1868,
                y: 358
            },
            "52":
            {
                height: 118,
                width: 114,
                x: 1054,
                y: 474
            },
            "53":
            {
                height: 116,
                width: 116,
                x: 1752,
                y: 120
            },
            "54":
            {
                height: 116,
                width: 116,
                x: 1634,
                y: 120
            },
            "55":
            {
                height: 114,
                width: 116,
                x: 702,
                y: 2
            },
            "56":
            {
                height: 118,
                width: 116,
                x: 1518,
                y: 476
            },
            "57":
            {
                height: 118,
                width: 116,
                x: 1288,
                y: 474
            },
            "58":
            {
                height: 116,
                width: 114,
                x: 472,
                y: 236
            },
            "59":
            {
                height: 116,
                width: 112,
                x: 588,
                y: 236
            },
            "6":
            {
                height: 118,
                width: 116,
                x: 1170,
                y: 474
            },
            "60":
            {
                height: 118,
                width: 112,
                x: 1518,
                y: 356
            },
            "61":
            {
                height: 116,
                width: 114,
                x: 2,
                y: 236
            },
            "62":
            {
                height: 118,
                width: 116,
                x: 822,
                y: 474
            },
            "63":
            {
                height: 114,
                width: 116,
                x: 470,
                y: 2
            },
            "64":
            {
                height: 116,
                width: 116,
                x: 1404,
                y: 118
            },
            "65":
            {
                height: 116,
                width: 116,
                x: 1170,
                y: 118
            },
            "66":
            {
                height: 118,
                width: 116,
                x: 704,
                y: 474
            },
            "67":
            {
                height: 118,
                width: 116,
                x: 586,
                y: 472
            },
            "68":
            {
                height: 116,
                width: 114,
                x: 1288,
                y: 118
            },
            "69":
            {
                height: 114,
                width: 112,
                x: 938,
                y: 2
            },
            "7":
            {
                height: 118,
                width: 116,
                x: 354,
                y: 472
            },
            "70":
            {
                height: 118,
                width: 110,
                x: 1870,
                y: 120
            },
            "71":
            {
                height: 118,
                width: 112,
                x:934,
                y:354
            },
            "72":
            {
                height:118,
                width:114,
                x:120,
                y:472,
            },
            "73":
            {
                height:116,
                width:116,
                x:822,
                y:118,
            },
            "74":
            {
                height: 116,
                width: 116,
                x:704,
                y:118,
            },
            "75":
            {
                height:114,
                width:116,
                x:352,
                y:2
            },
            "76":
            {
                height:118,
                width:116,
                x:236,
                y:472
            },
            "77":
            {
                height: 118,
                width: 116,
                x: 2,
                y:472
            },
            "78":
            {
                height: 116,
                width: 114,
                x:940,
                y:118
            },
            "79":
            {
                height: 116,
                width: 112,
                x: 1056,
                y: 118
            },
            "8":
            {
                height: 116,
                width: 114,
                x: 588,
                y: 118
            },
            "80":
            {
                height: 118,
                width: 112,
                x: 820,
                y: 354,
            },
            "81":
            {
                height: 116,
                width: 114,
                x: 236,
                y: 118
            },
            "82":
            {
                height: 118,
                width: 116,
                x: 1750,
                y: 356
            },
            "83":
            {
                height: 114,
                width: 116,
                x: 120,
                y: 2
            },
            "84":
            {
                height: 116,
                width: 116,
                x: 470,
                y: 118
            },
            "85":
            {
                height: 116,
                width: 116,
                x: 352,
                y: 118
            },
            "86":
            {
                height: 118,
                width: 116,
                x: 1632,
                y: 356
            },
            "87":
            {
                height: 118,
                width: 116,
                x: 1400,
                y: 354
            },
            "88":
            {
                height: 116,
                width: 114,
                x: 120,
                y: 118
            },
            "89":
            {
                height: 114,
                width: 112,
                x: 588,
                y: 2
            },
            "9": {
                height: 114,
                width: 112,
                x: 238,
                y: 2
            },
            "90":
            {
                height: 118,
                width: 110,
                x: 1522,
                y: 118
            },
            "91":
            {
                height: 118,
                width: 112,
                x: 706,
                y: 354
            },
            "92":
            {
                height: 118,
                width: 114,
                x: 1048,
                y: 354
            },
            "93":
            {
                height: 116,
                width: 116,
                x: 2,
                y: 118
            },
            "94":
            {
                height: 116,
                width: 116,
                x: 1750,
                y: 2
            },
            "95":
            {
                height: 114,
                width: 116,
                x: 2,
                y: 2
            },
            "96":
            {
                height: 118,
                width: 116,
                x: 1282,
                y: 354
            },
            "97":
            {
                height: 118,
                width: 116,
                x: 1164,
                y: 354
            },
            "98":
            {
                height: 116,
                width: 114,
                x: 1634,
                y: 2
            },
            "99":
            {
                height: 116,
                width: 112,
                x: 1868,
                y: 2
            },
            "f0":
            {
                height: 116,
                width: 114,
                x: 1282,
                y: 716
            },
            "f1":
            {
                height: 114,
                width: 116,
                x: 934,
                y: 1544
            },
            "f2":
            {
                height: 116,
                width: 116,
                x: 816,
                y: 1544
            },
            "f3":
            {
                height: 120,
                width: 116,
                x: 2,
                y: 370
            },
            "f4":
            {
                height: 118,
                width: 114,
                x: 582,
                y: 1198
            },
            "f5":
            {
                height: 120,
                width: 116,
                x: 120,
                y: 124
            },
            "f6":
            {
                height: 120,
                width: 114,
                x: 2,
                y: 1728
            },
            "f7":
            {
                height: 120,
                width: 116,
                x: 2,
                y: 248
            },
            "f8":
            {
                height: 116,
                width: 116,
                x: 698,
                y: 1544
            },
            "f9":
            {
                height: 122,
                width: 116,
                x: 2,
                y: 2
            },
            "r0":
            {
                height: 122,
                width: 112,
                x: 2,
                y: 1360
            },
            "r1":
            {
                height: 118,
                width: 116,
                x: 706,
                y: 362
            },
            "r10":
            {
                height: 116,
                width: 116,
                x: 934,
                y: 1426
            },
            "r100":
            {
                height: 122,
                width: 112,
                x: 2,
                y: 1236
            },
            "r101":
            {
                height: 118,
                width: 116,
                x: 588,
                y: 362
            },
            "r102":
            {
                height: 116,
                width: 116,
                x: 816,
                y: 1426
            },
            "r103":
            {
                height: 116,
                width: 116,
                x: 698,
                y: 1426
            },
            "r104":
            {
                height: 116,
                width: 116,
                x: 934,
                y: 1308
            },
            "r105":
            {
                height: 116,
                width: 114,
                x: 1166,
                y: 834
            },
            "r106":
            {
                height: 118,
                width: 112,
                x: 1166,
                y: 952
            },
            "r107":
            {
                height: 116,
                width: 112,
                x: 1156,
                y: 1660
            },
            "r108":
            {
                height: 120,
                width: 114,
                x: 2,
                y: 1606
            },
            "r109":
            {
                height: 118,
                width: 116,
                x: 470,
                y: 362
            },
            "r11":
            {
                height: 116,
                width: 116,
                x: 816,
                y: 1308
            },
            "r110":
            {
                height: 116,
                width: 116,
                x: 698,
                y: 1308
            },
            "r111":
            {
                height: 116,
                width: 116,
                x: 934,
                y: 1190
            },
            "r112":
            {
                height: 116,
                width: 116,
                x: 816,
                y: 1190
            },
            "r113":
            {
                height: 118,
                width: 116,
                x: 1296,
                y: 242
            },
            "r114":
            {
                height: 116,
                width: 114,
                x: 1282,
                y: 598
            },
            "r115":
            {
                height: 118,
                width: 112,
                x: 1052,
                y: 1438
            },
            "r116":
            {
                height: 114,
                width: 112,
                x: 1384,
                y: 1894
            },
            "r117":
            {
                height: 116,
                width: 110,
                x: 1394,
                y: 1544
            },
            "r118":
            {
                height: 118,
                width: 112,
                x: 1052,
                y: 1318
            },
            "r119":
            {
                height: 118,
                width: 114,
                x: 582,
                y: 1078
            },
            "r12":
            {
                height: 116,
                width: 116,
                x: 698,
                y: 1190
            },
            "r120":
            {
                height: 122,
                width: 112,
                x: 2,
                y: 1112
            },
            "r121":
            {
                height: 118,
                width: 116,
                x: 1178,
                y: 242
            },
            "r122":
            {
                height: 114,
                width: 116,
                x: 232,
                y: 1898
            },
            "r123":
            {
                height: 118,
                width: 116,
                x: 1060,
                y: 242
            },
            "r124":
            {
                height: 116,
                width: 116,
                x: 934,
                y: 1072
            },
            "r125":
            {
                height: 116,
                width: 114,
                x: 1166,
                y: 716
            },
            "r126":
            {
                height: 118,
                width: 112,
                x: 1052,
                y: 1198
            },
            "r127":
            {
                height: 116,
                width: 112,
                x: 1280,
                y: 1542
            },
            "r128":
            {
                height: 120,
                width: 116,
                x: 120,
                y: 2
            },
            "r129":
            {
                height: 118,
                width: 116,
                x: 942,
                y: 242
            },
            "r13":
            {
                height: 118,
                width: 116,
                x: 824,
                y: 242
            },
            "r130":
            {
                height: 116,
                width: 116,
                x: 816,
                y: 1072
            },
            "r131":
            {
                height: 116,
                width: 116,
                x: 698,
                y: 1072
            },
            "r132":
            {
                height: 118,
                width: 116,
                x: 706,
                y: 242
            },
            "r133":
            {
                height: 118,
                width: 116,
                x: 588,
                y: 242
            },
            "r134":
            {
                height: 116,
                width: 114,
                x: 1166,
                y: 598
            },
            "r135":
            {
                height: 118,
                width: 112,
                x: 1052,
                y: 1078
            },
            "r136":
            {
                height: 114,
                width: 112,
                x: 1384,
                y: 1778
            },
            "r137":
            {
                height: 116,
                width: 110,
                x: 1394,
                y: 1426
            },
            "r138":
            {
                height: 118,
                width: 112,
                x: 1052,
                y: 958
            },
            "r139":
            {
                height: 118,
                width: 114,
                x: 582,
                y: 958
            },
            "r14":
            {
                height: 118,
                width: 114,
                x: 582,
                y: 838
            },
            "r140":
            {
                height: 122,
                width: 114,
                x: 120,
                y: 246
            },
            "r141":
            {
                height: 118,
                width: 116,
                x: 470,
                y: 242
            },
            "r142":
            {
                height: 114,
                width: 116,
                x: 350,
                y: 1794
            },
            "r143":
            {
                height: 118,
                width: 116,
                x: 1296,
                y: 122
            },
            "r144":
            {
                height: 116,
                width: 116,
                x: 934,
                y: 954
            },
            "r145":
            {
                height: 116,
                width: 114,
                x: 814,
                y: 1898
            },
            "r146":
            {
                height: 118,
                width: 112,
                x: 1052,
                y: 838
            },
            "r147":
            {
                height: 116,
                width: 112,
                x: 1280,
                y: 1424
            },
            "r148":
            {
                height: 118,
                width: 114,
                x: 582,
                y: 718
            },
            "r149":
            {
                height: 118,
                width: 116,
                x: 1178,
                y: 122
            },
            "r15":
            {
                height: 118,
                width: 112,
                x: 1052,
                y: 718
            },
            "r150":
            {
                height: 116,
                width: 116,
                x: 816,
                y: 954
            },
            "r151":
            {
                height: 116,
                width: 116,
                x: 698,
                y: 954
            },
            "r152":
            {
                height: 116,
                width: 116,
                x: 934,
                y: 836
            },
            "r153":
            {
                height: 118,
                width: 116,
                x: 1060,
                y: 122
            },
            "r154":
            {
                height: 116,
                width: 114,
                x: 698,
                y: 1898
            },
            "r155":
            {
                height: 118,
                width: 112,
                x: 1044,
                y: 1900
            },
            "r156":
            {
                height: 114,
                width: 112,
                x: 1384,
                y: 1662
            },
            "r157":
            {
                height: 116,
                width: 112,
                x: 1166,
                y: 1426
            },
            "r158":
            {
                height: 118,
                width: 112,
                x: 1042,
                y: 1780
            },
            "r159":
            {
                height: 118,
                width: 114,
                x: 352,
                y: 1084
            },
            "r16":
            {
                height: 114,
                width: 112,
                x: 1270,
                y: 1892
            },
            "r160":
            {
                height: 122,
                width: 112,
                x: 2,
                y: 988
            },
            "r161":
            {
                height: 118,
                width: 116,
                x: 942,
                y: 122
            },
            "r162":
            {
                height: 116,
                width: 116,
                x: 816,
                y: 836
            },
            "r163":
            {
                height: 116,
                width: 116,
                x: 698,
                y: 836
            },
            "r164":
            {
                height: 116,
                width: 116,
                x: 934,
                y: 718
            },
            "r165":
            {
                height: 116,
                width: 114,
                x: 814,
                y: 1780
            },
            "r166":
            {
                height: 118,
                width: 110,
                x: 1394,
                y: 952
            },
            "r167":
            {
                height: 116,
                width: 112,
                x: 1280,
                y: 1306
            },
            "r168":
            {
                height: 120,
                width: 114,
                x: 2,
                y: 1484
            },
            "r169":
            {
                height: 118,
                width: 116,
                x: 824,
                y: 122
            },
            "r17":
            {
                height: 116,
                width: 110,
                x: 1394,
                y: 1308
            },
            "r170":
            {
                height: 116,
                width: 116,
                x: 936,
                y: 600
            },
            "r171":
            {
                height: 116,
                width: 116,
                x: 816,
                y: 718
            },
            "r172":
            {
                height: 116,
                width: 116,
                x: 818,
                y: 600
            },
            "r173":
            {
                height: 118,
                width: 116,
                x: 706,
                y: 122
            },
            "r174":
            {
                height: 116,
                width: 114,
                x: 814,
                y: 1662
            },
            "r175":
            {
                height: 118,
                width: 112,
                x: 1042,
                y: 1660
            },
            "r176":
            {
                height: 114,
                width: 112,
                x: 1270,
                y: 1776
            },
            "r177":
            {
                height: 116,
                width: 112,
                x: 1166,
                y: 1308
            },
            "r178":
            {
                height: 118,
                width: 112,
                x: 582,
                y: 1908
            },
            "r179":
            {
                height: 118,
                width: 114,
                x: 352,
                y: 964
            },
            "r18":
            {
                height: 118,
                width: 112,
                x: 468,
                y: 1804
            },
            "r180":
            {
                height: 122,
                width: 112,
                x: 2,
                y: 864
            },
            "r181":
            {
                height: 118,
                width: 116,
                x: 588,
                y: 122
            },
            "r182":
            {
                height: 114,
                width: 116,
                x: 234,
                y: 1310
            },
            "r183":
            {
                height: 116,
                width: 116,
                x: 698,
                y: 718
            },
            "r184":
            {
                height: 114,
                width: 116,
                x: 236,
                y: 486
            },
            "r185":
            {
                height: 116,
                width: 114,
                x: 698,
                y: 1780
            },
            "r186":
            {
                height: 118,
                width: 112,
                x: 468,
                y: 1684
            },
            "r187":
            {
                height: 116,
                width: 114,
                x: 582,
                y: 1790
            },
            "r188":
            {
                height: 118,
                width: 116,
                x: 470,
                y: 122
            },
            "r189":
            {
                height: 118,
                width: 116,
                x: 236,
                y: 366
            },
            "r19":
            {
                height: 118,
                width: 114,
                x: 352,
                y: 844
            },
            "r190":
            {
                height: 116,
                width: 116,
                x: 700,
                y: 600
            },
            "r191":
            {
                height: 118,
                width: 116,
                x: 236,
                y: 246
            },
            "r192":
            {
                height: 118,
                width: 116,
                x: 116,
                y: 1212
            },
            "r193":
            {
                height: 120,
                width: 116,
                x: 2,
                y: 126
            },
            "r194":
            {
                height: 118,
                width: 114,
                x: 352,
                y: 724
            },
            "r195":
            {
                height: 118,
                width: 112,
                x: 468,
                y: 1564
            },
            "r196":
            {
                height: 114,
                width: 110,
                x: 1158,
                y: 1894
            },
            "r197":
            {
                height: 116,
                width: 110,
                x: 1394,
                y: 1190
            },
            "r198":
            {
                height: 118,
                width: 110,
                x: 930,
                y: 1782
            },
            "r199":
            {
                height: 118,
                width: 114,
                x: 352,
                y: 604
            },
            "r2":
            {
                height: 116,
                width: 116,
                x: 582,
                y: 600
            },
            "r20":
            {
                height: 122,
                width: 112,
                x: 2,
                y: 740
            },
            "r21":
            {
                height: 118,
                width: 116,
                x: 116,
                y: 1092
            },
            "r22":
            {
                height: 116,
                width: 116,
                x: 350,
                y: 1910
            },
            "r23":
            {
                height: 118,
                width: 116,
                x: 116,
                y: 972
            },
            "r24":
            {
                height: 116,
                width: 116,
                x: 350,
                y: 1676
            },
            "r25":
            {
                height: 116,
                width: 114,
                x: 698,
                y: 1662
            },
            "r26":
            {
                height: 118,
                width: 112,
                x: 468,
                y: 1444
            },
            "r27":
            {
                height: 116,
                width: 112,
                x: 1280,
                y: 1188
            },
            "r28":
            {
                height: 120,
                width: 114,
                x: 354,
                y: 246
            },
            "r29":
            {
                height: 118,
                width: 116,
                x: 116,
                y: 852
            },
            "r3":
            {
                height: 116,
                width: 116,
                x: 350,
                y: 1558
            },
            "r30":
            {
                height: 116,
                width: 116,
                x: 350,
                y: 1440
            },
            "r31":
            {
                height: 116,
                width: 116,
                x: 232,
                y: 1780
            },
            "r32":
            {
                height: 116,
                width: 116,
                x: 232,
                y: 1662
            },
            "r33":
            {
                height: 118,
                width: 116,
                x: 1296,
                y: 2
            },
            "r34":
            {
                height: 116,
                width: 114,
                x: 582,
                y: 1672
            },
            "r35":
            {
                height: 118,
                width: 112,
                x: 468,
                y: 1324
            },
            "r36":
            {
                height: 114,
                width: 112,
                x: 1270,
                y: 1660
            },
            "r37":
            {
                height: 116,
                width: 112,
                x: 1166,
                y: 1190
            },
            "r38":
            {
                height: 118,
                width: 112,
                x: 468,
                y: 1204
            },
            "r39":
            {
                height: 118,
                width: 114,
                x: 940,
                y: 480
            },
            "r4":
            {
                height: 116,
                width: 116,
                x: 232,
                y: 1544
            },
            "r40":
            {
                height: 122,
                width: 114,
                x: 238,
                y: 2
            },
            "r41":
            {
                height: 118,
                width: 116,
                x: 1178,
                y: 2
            },
            "r42":
            {
                height: 116,
                width: 116,
                x: 232,
                y: 1426
            },
            "r43":
            {
                height: 116,
                width: 116,
                x: 1292,
                y: 480
            },
            "r44":
            {
                height: 116,
                width: 116,
                x: 1174,
                y: 480
            },
            "r45":
            {
                height: 116,
                width: 114,
                x: 582,
                y: 1554
            },
            "r46":
            {
                height: 118,
                width: 112,
                x: 468,
                y: 1084
            },
            "r47":
            {
                height: 116,
                width: 112,
                x: 1280,
                y: 1070
            },
            "r48":
            {
                height: 120,
                width: 114,
                x: 354,
                y: 124
            },
            "r49":
            {
                height: 118,
                width: 116,
                x: 1060,
                y: 2
            },
            "r5":
            {
                height: 116,
                width: 114,
                x: 582,
                y: 1436
            },
            "r50":
            {
                height: 116,
                width: 116,
                x: 1056,
                y: 480
            },
            "r51":
            {
                height: 116,
                width: 116,
                x: 706,
                y: 482
            },
            "r52":
            {
                height: 116,
                width: 116,
                x: 588,
                y: 482
            },
            "r53":
            {
                height: 118,
                width: 116,
                x: 942,
                y: 2
            },
            "r54":
            {
                height: 116,
                width: 114,
                x: 582,
                y: 1318
            },
            "r55":
            {
                height: 118,
                width: 112,
                x: 468,
                y: 964
            },
            "r56":
            {
                height: 114,
                width: 112,
                x: 1156,
                y: 1778
            },
            "r57":
            {
                height: 116,
                width: 112,
                x: 1280,
                y: 952
            },
            "r58":
            {
                height: 118,
                width: 112,
                x: 468,
                y: 844
            },
            "r59":
            {
                height: 118,
                width: 114,
                x: 824,
                y: 480
            },
            "r6":
            {
                height: 118,
                width: 112,
                x: 468,
                y: 724
            },
            "r60":
            {
                height: 122,
                width: 112,
                x: 2,
                y: 616
            },
            "r61":
            {
                height: 118,
                width: 116,
                x: 116,
                y: 732
            },
            "r62":
            {
                height: 116,
                width: 116,
                x: 470,
                y: 482
            },
            "r63":
            {
                height: 116,
                width: 116,
                x: 234,
                y: 1192
            },
            "r64":
            {
                height: 116,
                width: 116,
                x: 234,
                y: 1074
            },
            "r65":
            {
                height: 116,
                width: 114,
                x: 352,
                y: 1322
            },
            "r66":
            {
                height: 118,
                width: 110,
                x: 930,
                y: 1662
            },
            "r67":
            {
                height: 116,
                width: 112,
                x: 1166,
                y: 1072
            },
            "r68":
            {
                height: 120,
                width: 114,
                x: 116,
                y: 1332
            },
            "r69":
            {
                height: 118,
                width: 116,
                x: 824,
                y: 2
            },
            "r7":
            {
                height: 116,
                width: 112,
                x: 1282,
                y: 834
            },
            "r70":
            {
                height: 116,
                width: 116,
                x: 234,
                y: 956
            },
            "r71":
            {
                height: 116,
                width: 116,
                x: 234,
                y: 838
            },
            "r72":
            {
                height: 116,
                width: 116,
                x: 234,
                y: 720
            },
            "r73":
            {
                height: 118,
                width: 116,
                x: 116,
                y: 612
            },
            "r74":
            {
                height: 116,
                width: 114,
                x: 352,
                y: 1204
            },
            "r75":
            {
                height: 118,
                width: 112,
                x: 468,
                y: 604
            },
            "r76":
            {
                height: 114,
                width: 112,
                x: 1166,
                y: 1544
            },
            "r77":
            {
                height: 116,
                width: 110,
                x: 1394,
                y: 1072
            },
            "r78":
            {
                height: 118,
                width: 112,
                x: 118,
                y: 1814
            },
            "r79":
            {
                height: 118,
                width: 114,
                x: 2,
                y: 1850
            },
            "r8":
            {
                height: 120,
                width: 114,
                x: 120,
                y: 370
            },
            "r80":
            {
                height: 122,
                width: 112,
                x: 2,
                y: 492
            },
            "r81":
            {
                height: 118,
                width: 116,
                x: 706,
                y: 2
            },
            "r82":
            {
                height: 116,
                width: 116,
                x: 234,
                y: 602
            },
            "r83":
            {
                height: 116,
                width: 116,
                x: 1296,
                y: 362
            },
            "r84":
            {
                height: 116,
                width: 116,
                x: 1178,
                y: 362
            },
            "r85":
            {
                height: 116,
                width: 114,
                x: 354,
                y: 486
            },
            "r86":
            {
                height: 118,
                width: 112,
                x: 118,
                y: 1694
            },
            "r87":
            {
                height: 116,
                width: 112,
                x: 930,
                y: 1902
            },
            "r88":
            {
                height: 120,
                width: 114,
                x: 354,
                y: 2
            },
            "r89":
            {
                height: 118,
                width: 116,
                x: 116,
                y: 492
            },
            "r9":
            {
                height: 118,
                width: 116,
                x: 588,
                y: 2
            },
            "r90":
            {
                height: 116,
                width: 116,
                x: 1060,
                y: 362
            },
            "r91":
            {
                height: 116,
                width: 116,
                x: 942,
                y: 362
            },
            "r92":
            {
                height: 116,
                width: 116,
                x: 824,
                y: 362
            },
            "r93":
            {
                height: 118,
                width: 116,
                x: 470,
                y: 2
            },
            "r94":
            {
                height: 116,
                width: 114,
                x: 354,
                y: 368
            },
            "r95":
            {
                height: 118,
                width: 112,
                x: 118,
                y: 1574
            },
            "r96":
            {
                height: 114,
                width: 112,
                x: 468,
                y: 1924
            },
            "r97":
            {
                height: 116,
                width: 110,
                x: 1054,
                y: 600
            },
            "r98":
            {
                height: 118,
                width: 112,
                x: 118,
                y: 1454
            },
            "r99":
            {
                height: 118,
                width: 114,
                x: 238,
                y: 126
            }
        };

        var iStr = i.toString();
        var y = 0;
        if (iStr.indexOf("f") >= 0 || iStr.indexOf("r") >= 0) {
            y = 716;
        }

        return [
            sprites[iStr].x, sprites[iStr].y + y, sprites[iStr].width, sprites[iStr].height
        ];
    };

    this.getIdleDiceSprites = function(i) {
        var ret = [];
        for (var j = i * 20; j < (i + 1) * 20; j++) {
            var sprite = this.getDiceSprite(j);
            ret.push(sprite[0]);
            ret.push(sprite[1]);
            ret.push(sprite[2]);
            ret.push(sprite[3]);
        }
        return ret;
    }

    this.config = kcConfig;
    this.dices = [];
    this.running = true;
}
MainPlay.prototype.init = function() {
    var self = this;
    var stage = new Kinetic.Stage(this.config);
    self.layer = new Kinetic.Layer();
    window.animationInitialized = "start";

    var imageObj = new Image();
    imageObj.onload = function() {
        for(var i = 0; i < self.config.diceCount; i++) {
            var idle = self.getIdleDiceSprites(i);
            var dice = new Kinetic.Sprite({
                x: 0 + i * 130,
                y: 0,
                image: imageObj,
                animation: 'idle',
                animations: {
                    idle: idle
                },
                frameRate: 13,
                frameIndex: 0
            });

            dice.on('frameIndexChange', function(evt) {
                if (this.animation() === 'result' && this.frameIndex() === 28) {
                    this.stop();
                    self.layer.draw();
                }
            });

            self.dices.push(dice);
            self.layer.add(dice);
            dice.start();
        }
        stage.add(self.layer);
        self.running = false;
        window.animationInitialized = "done";
    };
    imageObj.src = 'res/result.png';
}
MainPlay.prototype.startResultDice = function(dice, delay) {
    setTimeout(function() {
        dice.animation('result');
    }, delay);
};
MainPlay.prototype.runDice = function(g_Dices) {
    var self = this;
    if (self.running) {
        return;
    }
    self.running = true;

    var result = [];

    var m_Dice_index = 0 | (Math.random() * 10000) %9;
    for(var i = 0; i < this.config.diceCount; i++) {
        result[i] = [];
        for(var j = 0; j < 9; j++) {
            var dice = this.getDiceSprite("f" + j);
            result[i].push(dice[0]);
            result[i].push(dice[1]);
            result[i].push(dice[2]);
            result[i].push(dice[3]);
        }
        var num = parseInt(g_Dices[i], 10);
        for(j = 20 * num; j < 20 * (num + 1); j++){
            var dice1 = this.getDiceSprite("r" + j);
            result[i].push(dice1[0]);
            result[i].push(dice1[1]);
            result[i].push(dice1[2]);
            result[i].push(dice1[3]);
        }
    }

    for(var i = 0; i < this.dices.length; i++) {
        var animations = self.dices[i].animations();
        animations.result = result[i].slice();
        self.dices[i].animations(animations);
        self.startResultDice(self.dices[i], (this.dices.length - 1 - i) * 1000);
    }

    setTimeout(function() {
        for(var k = 0; k < self.dices.length; k++) {
            self.dices[k].animation('idle');
            if (!self.dices[k].isRunning()) {
                self.dices[k].start();
            }
        }
        self.running = false;
    }, self.config.spinTime);
};
var g_MainPlay = new MainPlay(document.kcConfig);
g_MainPlay.init();