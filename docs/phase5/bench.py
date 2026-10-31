import math
FT=0.3048; YD=0.9144
# Arccos (feet) brackets 0-5,6-10,11-15,16-20,20+
A70={'0-5':41.38,'6-10':45.20,'11-15':50.49,'16-20':55.21,'20+':62.45}
A110={'0-5':48.82,'6-10':54.56,'11-15':61.85,'16-20':70.76,'20+':83.46}
# Shot Scope (feet) hcp 0,5,10,15,20,25
S100={0:31,5:41,10:49,15:59,20:65,25:75}
S150={0:44,5:63,10:72,15:92,20:109,25:116}
def ss(d,h):
    return {k:d[k] for k in d}[h] if h in d else None
def ss_h(d,h):
    if h in d: return d[h]
    lo=max(k for k in d if k<h); hi=min(k for k in d if k>h)
    return d[lo]+(h-lo)/(hi-lo)*(d[hi]-d[lo])
bands={'11-0':dict(h=5,ar70=(A70['0-5']+A70['6-10'])/2,ar110=(A110['0-5']+A110['6-10'])/2),
       '26-12':dict(h=19,ar70=A70['16-20'],ar110=A110['16-20']),
       '54-27':dict(h=25,ar70=A70['20+'],ar110=A110['20+'])}
for b,v in bands.items():
    v['s100']=ss_h(S100,v['h']); v['s150']=ss_h(S150,v['h'])
    print(b,v)
def prox_arccos(yd,b):
    v=bands[b]; return v['ar70']+(yd-70)/40*(v['ar110']-v['ar70'])
def prox_ss(yd,b):
    v=bands[b]; return v['s100']+(yd-100)/50*(v['s150']-v['s100'])
def prox_mixed(yd,b):
    v=bands[b]
    if yd<=100: return v['ar70']+(yd-70)/30*(v['s100']-v['ar70'])
    return prox_ss(yd,b)
def P(R,mean): # Rayleigh
    return 1-math.exp(-(math.pi/4)*(R/mean)**2)
print("\nDrill1 Donald: 75..102yd step3, arccos interp; mean prox m per band and mean over distances")
for b in bands:
    ds=list(range(75,103,3)); m=[prox_arccos(d,b)*FT for d in ds]
    print(b,'per-dist m',[round(x,1) for x in m],'avg',round(sum(m)/len(m),2), 'median-ish(0.94*avg)',round(0.9394*sum(m)/len(m),2))
print("\nDrill2 JT random 126..150yd (mid 138): shot scope interp")
for b in bands:
    p=prox_ss(138,b)*FT; print(b,'mean m',round(p,2),'median',round(0.9394*p,2), 'at126',round(prox_ss(126,b)*FT,1),'at150',round(prox_ss(150,b)*FT,1))
print("\nDrill3 Pinseeker 120m flag, R=12m, 10 balls")
yd=120/YD
for b in bands:
    mn=prox_ss(yd,b)*FT; p=P(12,mn); print(b,'yd',round(yd,1),'mean m',round(mn,2),'P',round(p,3),'E hits/10',round(10*p,2))
print("\nDrill4 AIST adapted 9 targets 55..135m step10, 3 balls each, R=10% d")
for b in bands:
    E=0;row=[]
    for dm in range(55,136,10):
        y=dm/YD; mn=prox_mixed(y,b)*FT; p=P(0.1*dm,mn); E+=3*p; row.append((dm,round(mn,1),round(p,2)))
    print(b,row,'E/27',round(E,2))
print("\nDrill5 TG 10-ball: 10 targets 60..132m step8; 3 pts r<R, 2 pts R<=r<2R, 1 pt else, R=10%d")
for b in bands:
    E=0;row=[]
    for dm in range(60,133,8):
        y=dm/YD; mn=prox_mixed(y,b)*FT; R=0.1*dm; e=1+P(2*R,mn)+P(R,mn); E+=e; row.append((dm,round(mn,1),round(P(R,mn),2),round(P(2*R,mn),2)))
    print(b,row,'E pts/30',round(E,2))
print("\nPinseeker points: +2 r<R, +1 R<=r<2R, 10 balls, 120m, R=12")
for b in bands:
    mn=prox_ss(120/YD,b)*FT; e=P(12,mn)+P(24,mn); print(b,round(mn,2),round(P(12,mn),3),round(P(24,mn),3),'E/10balls',round(10*e,2))
print("Rayleigh P(r<mean)",round(1-math.exp(-math.pi/4),3))
